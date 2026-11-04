'use client';

import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { containsComposed, getComposedActiveElement } from '../../utils/focus-target.js';
import { closestHiddenSubtree, useFocusRecovery } from '../../utils/use-focus-recovery.js';

export interface DockPanelFocus {
  /** A ref callback for the tab of the pane with `key`. */
  tabRef: (key: Key) => (node: HTMLElement | null) => void;
  /** A ref callback for the collapsed launcher of the pane with `key`. */
  launcherRef: (key: Key) => (node: HTMLElement | null) => void;
  /** Moves focus to the tab of the pane with `key` once the panel shows it. */
  requestFocus: (key: Key) => void;
}

interface FocusOptions {
  /** The pane shown beside the main content, if any. */
  openKey: Key | null;
  rootRef: RefObject<HTMLElement | null>;
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

/** Whether focus sits in a part of the panel that an update hid, such as its tabs or its body. */
function isFocusHidden(root: HTMLElement | null) {
  const active = root ? getComposedActiveElement(root) : null;
  return Boolean(root && active && containsComposed(root, active) && closestHiddenSubtree(active));
}

/** Whether an element can take focus: it is shown and not disabled. */
function isEnabled(element: HTMLElement) {
  return (
    element.isConnected &&
    !element.hasAttribute('disabled') &&
    element.getAttribute('aria-disabled') !== 'true'
  );
}

/**
 * Focus handoff between the collapsed launchers and the expanded tabs: a launcher that expands the
 * panel hands focus to its pane's tab, and when the panel collapses while focus is in its tabs or
 * its pane, focus moves to the selected pane's launcher. It runs after every commit, before the
 * browser drops focus from an element that became hidden. When the element holding focus is removed
 * or disabled instead, focus moves to the shown pane's tab, else to the first enabled launcher.
 */
export function useDockPanelFocus({ openKey, rootRef }: FocusOptions): DockPanelFocus {
  const [tabs] = useState(() => new Map<Key, HTMLElement>());
  const [launchers] = useState(() => new Map<Key, HTMLElement>());
  const request = useRef<Key | null>(null);
  const previous = useRef(openKey);

  useLayoutEffect(() => {
    const before = previous.current;
    const requested = request.current;
    previous.current = openKey;
    request.current = null;
    if (openKey !== null && requested === openKey) {
      tabs.get(openKey)?.focus();
      return;
    }
    if (before === null || openKey !== null) return;
    if (isFocusHidden(rootRef.current)) launchers.get(before)?.focus();
  });
  useFocusRecovery(rootRef, () => {
    const shown = openKey === null ? undefined : tabs.get(openKey);
    return shown ?? [...launchers.values()].find(isEnabled);
  });

  return {
    tabRef: useElementMap(tabs),
    launcherRef: useElementMap(launchers),
    requestFocus: (key) => {
      request.current = key;
    },
  };
}
