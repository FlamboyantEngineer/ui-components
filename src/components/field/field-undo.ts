'use client';

import { type KeyboardEvent, useEffect } from 'react';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { readCommandKey } from '../shortcut/shortcut.js';
import { isOwnFieldTarget } from './field-root.js';

/** The undo and redo of one field, as its root element registers them. */
export interface FieldUndo {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  undo(): void;
  redo(): void;
}

type FieldUndoDirection = 'undo' | 'redo';

// Keyed by the field's root element, so an entry leaves with its element and nothing else can reach
// a field's history: there is no channel that every mounted field listens to.
const registry = new WeakMap<Element, FieldUndo>();

/** Registers the undo of the field whose root is `root`; returns the function that removes it. */
export function registerFieldUndo(root: Element, undo: FieldUndo): () => void {
  registry.set(root, undo);
  return () => {
    // A later registration on the same element stays when an earlier one's cleanup runs late.
    if (registry.get(root) === undo) registry.delete(root);
  };
}

/**
 * The undo of the field nearest to `element` (the element itself or its closest ancestor that is a
 * field root), or `null` outside any field. A host's shortcut handler passes the focused element.
 */
export function getFieldUndo(element: Element | null | undefined): FieldUndo | null {
  for (let node = element ?? null; node; node = node.parentElement) {
    const undo = registry.get(node);
    if (undo) return undo;
  }
  return null;
}

/** The direction of an undo or redo chord: Ctrl or Cmd with Z, Shift+Z or Y. */
function undoDirection(event: KeyboardEvent): FieldUndoDirection | null {
  if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  // An input method composing in the control owns its keys.
  if (isComposingKey(event.nativeEvent)) return null;
  const key = readCommandKey(event);
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
  return key === 'y' && !event.shiftKey ? 'redo' : null;
}

/**
 * Registers a field's undo on its root element (read through `getRoot` after each commit) and returns
 * the root's key handler, which applies undo and redo chords pressed inside the field.
 */
export function useFieldUndo(getRoot: () => Element | null, undo: FieldUndo) {
  useEffect(() => {
    const root = getRoot();
    return root ? registerFieldUndo(root, undo) : undefined;
  }, [getRoot, undo]);

  return (event: KeyboardEvent<HTMLElement>) => {
    const direction = undoDirection(event);
    // Keys from a menu portalled inside the field's React tree, or from a field nested in it, are
    // not the field's own.
    if (!direction || !isOwnFieldTarget(event.currentTarget, event.target)) return;
    if (direction === 'undo' ? !undo.canUndo : !undo.canRedo) return;
    event.preventDefault();
    undo[direction]();
  };
}
