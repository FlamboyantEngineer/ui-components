'use client';

import { useLayoutEffect, useRef } from 'react';
import { isFocusLost } from './focus-target.js';
import { isElement, isNode } from './is-element.js';

/**
 * Focuses the item with `key` once the collection renders it (a virtual layout renders its items
 * after measuring), unless focus lands somewhere else first. Returns a function that stops waiting.
 */
function refocusItem(collection: HTMLElement, key: string): () => void {
  const owner = collection.ownerDocument;
  const attempt = () => {
    if (!isFocusLost(owner)) return true;
    const item = collection.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
    item?.focus();
    return item !== null;
  };
  if (attempt()) return () => undefined;
  const observer = new MutationObserver(() => {
    if (attempt()) observer.disconnect();
  });
  observer.observe(collection, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Keeps focus on the same item when a collection mounts afresh for another `mode` (a layout, or
 * virtualized or not): the item that held focus, if focus had not moved elsewhere, takes it
 * again. Returns the ref for the collection's root, whose items carry `data-key`.
 */
export function useCarriedFocus<E extends HTMLElement>(mode: string) {
  const collectionRef = useRef<E>(null);
  const focusedKey = useRef<string | null>(null);
  useLayoutEffect(() => {
    const collection = collectionRef.current;
    if (!collection) return undefined;
    const key = focusedKey.current;
    const stopRefocus = key === null ? undefined : refocusItem(collection, key);
    const onFocusIn = (event: FocusEvent) => {
      const target = isElement(event.target) ? event.target : null;
      focusedKey.current = target?.closest('[data-key]')?.getAttribute('data-key') ?? null;
    };
    // An item leaving the page takes focus to nowhere; focus moved elsewhere names where it went.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (isNode(next) && !collection.contains(next)) focusedKey.current = null;
    };
    collection.addEventListener('focusin', onFocusIn);
    collection.addEventListener('focusout', onFocusOut);
    return () => {
      stopRefocus?.();
      collection.removeEventListener('focusin', onFocusIn);
      collection.removeEventListener('focusout', onFocusOut);
    };
  }, [mode]);
  return collectionRef;
}
