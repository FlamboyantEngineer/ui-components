'use client';

// The root elements of the mounted fields, so a field's handlers can tell an event of its own from
// one of a field nested inside it (in its description, decoration or a custom control).

import { useEffect } from 'react';
import { isElement } from '../../utils/is-element.js';

const roots = new WeakSet<Element>();

/** Marks the field's root element (read through `getRoot` after mounting) as a field root. */
export function useFieldRoot(getRoot: () => Element | null) {
  useEffect(() => {
    const root = getRoot();
    if (!root) return undefined;
    roots.add(root);
    return () => void roots.delete(root);
  }, [getRoot]);
}

/**
 * Whether `target` is the field's own: inside its root `root` and not inside another field's root
 * within it.
 */
export function isOwnFieldTarget(root: Element, target: EventTarget | null): boolean {
  for (let node = isElement(target) ? target : null; node; node = node.parentElement) {
    if (node === root) return true;
    if (roots.has(node)) return false;
  }
  return false;
}
