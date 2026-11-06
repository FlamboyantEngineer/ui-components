'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStableArray } from './use-stable-array.js';

/** No image to load (`idle`), or the image is loading, has loaded or has failed. */
type ImageRequestStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Where one image request stands, and the handlers its `<img>` settles it through. */
export interface ImageLoading {
  /** Counts the requests, so each gets its own `<img>` (its `key`) and an old one's events go nowhere. */
  generation: number;
  status: ImageRequestStatus;
  /** The `<img>`'s `onLoad` and `onError` report through it. */
  settle: (status: 'loaded' | 'error') => void;
  /** The `<img>`'s ref: settles an image the browser finished before the handlers were attached. */
  imageRef: (image: HTMLImageElement | null) => void;
  /** Requests the same image again with a fresh `<img>`. */
  retry: () => void;
}

/**
 * Tracks whether the image that `requested` names (its address and every attribute that chooses or
 * fetches a candidate, compared item by item) has loaded or failed. A different request, or a
 * retry, starts loading afresh, so an earlier failure never carries over; an empty request is
 * `idle`. `onStatusChange` hears each status, first on mount and then whenever it changes.
 */
export function useImageLoading(
  requested: readonly unknown[],
  onStatusChange?: ((status: ImageRequestStatus) => void) | undefined,
): ImageLoading {
  const request = useStableArray(requested);
  const [tracked, setTracked] = useState({ request, generation: 0 });
  if (tracked.request !== request) setTracked({ request, generation: tracked.generation + 1 });
  const generation = tracked.request === request ? tracked.generation : tracked.generation + 1;
  const [settled, setSettled] = useState<{
    generation: number;
    status: 'loaded' | 'error';
  } | null>(null);
  const status: ImageRequestStatus =
    request.length === 0 ? 'idle' : settled?.generation === generation ? settled.status : 'loading';
  const settle = useCallback(
    (next: 'loaded' | 'error') =>
      setSettled((previous) =>
        previous?.generation === generation && previous.status === next
          ? previous
          : { generation, status: next },
      ),
    [generation],
  );
  // An image the browser settled before the handlers were attached, such as before hydration,
  // fires no event to them. A lazy image that has not started is not complete, so it stays loading.
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image?.complete) return;
      if (image.naturalWidth > 0) settle('loaded');
      // An image without intrinsic size, such as some SVG, has no width once loaded either.
      else if (typeof image.decode === 'function') {
        // Each request has its own image element, so one that has left answers nothing.
        const answer = (next: 'loaded' | 'error') => image.isConnected && settle(next);
        image.decode().then(
          () => answer('loaded'),
          () => answer('error'),
        );
      } else settle('error');
    },
    [settle],
  );
  const reported = useRef<ImageRequestStatus | null>(null);
  useEffect(() => {
    if (reported.current === status) return;
    reported.current = status;
    onStatusChange?.(status);
  });
  return {
    generation,
    status,
    settle,
    imageRef,
    retry: () => setTracked({ request, generation: generation + 1 }),
  };
}
