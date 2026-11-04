'use client';

import { useState } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { isImageItem, type MediaViewerItem } from './media-viewer-parts.js';

/** Where the shown image's request stands: still loading, drawn, or failed. */
type MediaImageStatus = 'loading' | 'loaded' | 'failed';

/** The shown image's request and what it came to. */
export interface MediaImageRequest {
  /** Names one request: the item, its URL and the attempt, so a retry or a new URL starts afresh. */
  id: string;
  /** `loaded` for an item that is not an image, which has nothing to load. */
  status: MediaImageStatus;
  /** Reports what request `id` came to; a report for any other request is ignored. */
  settle: (id: string, status: Exclude<MediaImageStatus, 'loading'>) => void;
  /** Requests the image again. */
  retry: () => void;
}

/**
 * The request for `item`'s image. Moving to another item, a new `src` or a retry starts a new
 * request, which loads until its image reports; a report from an earlier request changes nothing.
 * A failure is reported to `onImageError`, which may give the item a fresh `src`.
 */
export function useImageRequest(
  item: MediaViewerItem | undefined,
  onImageError?: (item: MediaViewerItem) => void,
): MediaImageRequest {
  const identity = item ? toKeyIdentity(item.id) : '';
  const [attempt, setAttempt] = useState({ identity, count: 0 });
  const count = attempt.identity === identity ? attempt.count : 0;
  const id = JSON.stringify([identity, item?.src, count]);
  const [settled, setSettled] = useState<{ id: string; status: MediaImageStatus } | null>(null);
  const status =
    !item || !isImageItem(item) ? 'loaded' : settled?.id === id ? settled.status : 'loading';
  return {
    id,
    status,
    settle: (requestId, next) => {
      if (requestId !== id) return;
      setSettled({ id: requestId, status: next });
      if (next === 'failed' && item) onImageError?.(item);
    },
    retry: () => setAttempt({ identity, count: count + 1 }),
  };
}
