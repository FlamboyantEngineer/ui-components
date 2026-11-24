'use client';

import { useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useLatest } from '../../utils/use-latest.js';
import { isImageItem, type MediaViewerItem } from './media-viewer-parts.js';

/** Where the shown image's request stands: still loading, drawn, or failed. */
type MediaImageStatus = 'loading' | 'loaded' | 'failed';

/** The shown image's request and what it came to. */
export interface MediaImageRequest {
  /** Names one request: the item, its URL and the attempt, so a retry or a new URL starts afresh. */
  id: number;
  /** `loaded` for an item that is not an image, which has nothing to load. */
  status: MediaImageStatus;
  /** Reports what request `id` came to; a report for any other request is ignored. */
  settle: (id: number, status: Exclude<MediaImageStatus, 'loading'>) => void;
  /** Requests the image again. */
  retry: () => void;
}

interface ImageAttempt {
  key: Key | undefined;
  source: string | undefined;
  isOpen: boolean;
  id: number;
  status: MediaImageStatus;
}

/**
 * The request for `item`'s image. Moving to another item, a new `src` or a retry starts a new
 * request, which loads until its image reports; a report from an earlier request changes nothing.
 * A failure is reported to `onImageError`, which may give the item a fresh `src`.
 */
export function useImageRequest(
  item: MediaViewerItem,
  isOpen: boolean,
  onImageError?: (item: MediaViewerItem) => void,
): MediaImageRequest {
  const image = isImageItem(item) ? item : undefined;
  const key = image?.id;
  const source = image?.src;
  const [attempt, setAttempt] = useState<ImageAttempt>({
    key,
    source,
    isOpen,
    id: 0,
    status: 'loading',
  });
  if (attempt.key !== key || attempt.source !== source || attempt.isOpen !== isOpen) {
    setAttempt(
      isOpen
        ? { key, source, isOpen, id: attempt.id + 1, status: 'loading' }
        : { ...attempt, key, source, isOpen },
    );
  }
  const latest = useLatest({ attempt, item, onImageError });
  const lastSettledId = useRef<number | null>(null);
  return {
    id: attempt.id,
    status: source === undefined ? 'loaded' : attempt.status,
    settle: (id, status) => {
      const current = latest.current;
      if (
        !current.attempt.isOpen ||
        current.attempt.id !== id ||
        current.attempt.status !== 'loading' ||
        lastSettledId.current === id
      )
        return;
      const settled = { ...current.attempt, status };
      lastSettledId.current = id;
      setAttempt((previous) => (previous.id === id ? settled : previous));
      if (status === 'failed') current.onImageError?.(current.item);
    },
    retry: () =>
      setAttempt((previous) =>
        previous.id === attempt.id
          ? { ...previous, id: previous.id + 1, status: 'loading' }
          : previous,
      ),
  };
}
