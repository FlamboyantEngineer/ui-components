'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';

/** Lets focus-driven scrolling settle before an overlay subscribes to scroll dismissal. */
export function useFrameFlag(isActive: boolean, ownerRef: RefObject<Element | null>): boolean {
  const [isReady, setReady] = useState(false);
  useLayoutEffect(() => {
    if (!isActive) return;
    const view = ownerRef.current?.ownerDocument.defaultView ?? window;
    let isCurrent = true;
    const frame = view.requestAnimationFrame(() => {
      if (isCurrent) setReady(true);
    });
    return () => {
      isCurrent = false;
      view.cancelAnimationFrame(frame);
      setReady(false);
    };
  }, [isActive, ownerRef]);
  return isActive && isReady;
}
