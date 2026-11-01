'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { containsFocus } from '../../utils/focus-target.js';
import { useFocusRecovery } from '../../utils/use-focus-recovery.js';

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

/** Whether a launcher can take focus: it is shown and not disabled. */
function isEnabledLauncher(launcher: HTMLElement) {
  return launcher.isConnected && !launcher.hasAttribute('disabled');
}

/**
 * Focus handoff between launchers and panes: a pane its launcher opened takes focus, and when the
 * open pane closes while it holds focus, focus moves back to its launcher. It runs after every
 * commit, before the browser moves focus out of a pane that became hidden. When the pane holding
 * focus is removed or disabled instead, focus moves to the pane shown in its place, else to the
 * first enabled launcher.
 */
export function useDockPanelFocus(
  openKey: Key | null,
  rootRef: RefObject<HTMLElement | null>,
): DockPanelFocus {
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
    if (containsFocus(panes.get(before))) launchers.get(before)?.focus();
  });
  useFocusRecovery(rootRef, () => {
    const shown = openKey === null ? undefined : panes.get(openKey);
    return shown ?? [...launchers.values()].find(isEnabledLauncher);
  });

  return {
    paneRef: useElementMap(panes),
    launcherRef: useElementMap(launchers),
    requestFocus: (key) => {
      request.current = key;
    },
  };
}
