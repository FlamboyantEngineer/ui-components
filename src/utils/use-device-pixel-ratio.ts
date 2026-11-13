'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { getOwnerWindow } from './owner-window.js';

const readServerRatio = () => 1;
const stopNothing = () => undefined;

/**
 * The device pixel ratio of the window `node` is in, 1 before there is a node. The component
 * renders again when the ratio changes, as when the reader zooms the page or moves the window to
 * another screen, so what it drew at the old ratio can be drawn again.
 */
export function useDevicePixelRatio(node: Node | null): number {
  const subscribe = useCallback(
    (notify: () => void) => {
      const view = node ? getOwnerWindow(node) : null;
      if (!view || typeof view.matchMedia !== 'function') return stopNothing;
      let stop: () => void = stopNothing;
      // A resolution query answers for one ratio, so each change listens for the next one.
      const listen = () => {
        const query = view.matchMedia(`(resolution: ${String(view.devicePixelRatio)}dppx)`);
        const onChange = () => {
          stop();
          listen();
          notify();
        };
        query.addEventListener('change', onChange);
        stop = () => query.removeEventListener('change', onChange);
      };
      listen();
      return () => stop();
    },
    [node],
  );
  const read = useCallback(() => (node ? getOwnerWindow(node).devicePixelRatio || 1 : 1), [node]);
  return useSyncExternalStore(subscribe, read, readServerRatio);
}
