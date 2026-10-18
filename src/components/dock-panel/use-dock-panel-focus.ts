import { useLayoutEffect, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';

export interface DockPanelFocus {
  /** A ref callback for the pane with `key`. */
  paneRef: (key: Key) => (node: HTMLElement | null) => void;
  /** A ref callback for the launcher of the pane with `key`. */
  launcherRef: (key: Key) => (node: HTMLElement | null) => void;
  /** Moves focus into the pane with `key` once it opens. */
  requestFocus: (key: Key) => void;
}

/** A stable ref callback per key that files its element under that key. */
function useElementMap(elements: Map<Key, HTMLElement>) {
  const [callbacks] = useState(() => new Map<Key, (node: HTMLElement | null) => void>());
  return (key: Key) => {
    let callback = callbacks.get(key);
    if (!callback) {
      callback = (node) => {
        if (node) elements.set(key, node);
        else elements.delete(key);
      };
      callbacks.set(key, callback);
    }
    return callback;
  };
}

/**
 * Focus handoff between launchers and panes: a pane its launcher opened takes focus, and when the
 * open pane closes while it holds focus, focus moves back to its launcher. It runs after every
 * commit, before the browser moves focus out of a pane that became hidden.
 */
export function useDockPanelFocus(openKey: Key | null): DockPanelFocus {
  const [panes] = useState(() => new Map<Key, HTMLElement>());
  const [launchers] = useState(() => new Map<Key, HTMLElement>());
  const request = useRef<Key | null>(null);
  const previous = useRef(openKey);

  useLayoutEffect(() => {
    const before = previous.current;
    const requested = request.current;
    previous.current = openKey;
    request.current = null;
    if (openKey !== null && requested === openKey) {
      panes.get(openKey)?.focus();
      return;
    }
    if (before === null || before === openKey) return;
    const pane = panes.get(before);
    if (pane?.contains(pane.ownerDocument.activeElement)) launchers.get(before)?.focus();
  });

  return {
    paneRef: useElementMap(panes),
    launcherRef: useElementMap(launchers),
    requestFocus: (key) => {
      request.current = key;
    },
  };
}
