'use client';

// The order of a document's open blocking modals, which each publishes as `data-stack-index`.

import { useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { findOwnerDocument } from '../../utils/owner-window.js';
import { usePortalContainer } from '../portal/portal.js';

interface ModalStack {
  readonly entries: object[];
  readonly listeners: Set<() => void>;
  readonly subscribe: (listener: () => void) => () => void;
}

/** Each document's open blocking modals, lowest first. */
const stacks = new WeakMap<Document, ModalStack>();

function getStack(owner: Document): ModalStack {
  let stack = stacks.get(owner);
  if (!stack) {
    const listeners = new Set<() => void>();
    stack = {
      entries: [],
      listeners,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    stacks.set(owner, stack);
  }
  return stack;
}

function change(stack: ModalStack, edit: () => void): void {
  edit();
  for (const listener of [...stack.listeners]) listener();
}

const noStack = (): (() => void) => () => undefined;

/**
 * The modal's place among the open blocking modals of the document it opens in, from 0 for the
 * lowest, in the order they opened. A modal that closes keeps its last place while it leaves;
 * `undefined` before it first opens, and on the server.
 */
export function useModalStackIndex(isOpen: boolean): number | undefined {
  const container = usePortalContainer();
  const owner = findOwnerDocument(container);
  const stack = owner ? getStack(owner) : null;
  const [entry] = useState(() => ({}));
  const index = useSyncExternalStore(
    stack ? stack.subscribe : noStack,
    () => (stack ? stack.entries.indexOf(entry) : -1),
    () => -1,
  );
  useLayoutEffect(() => {
    if (!isOpen || !stack) return undefined;
    change(stack, () => stack.entries.push(entry));
    return () => change(stack, () => stack.entries.splice(stack.entries.indexOf(entry), 1));
  }, [isOpen, stack, entry]);
  const [lastIndex, setLastIndex] = useState<number>();
  if (index >= 0 && index !== lastIndex) setLastIndex(index);
  return index >= 0 ? index : lastIndex;
}
