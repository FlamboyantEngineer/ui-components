'use client';

import { type RefObject, useEffect, useRef } from 'react';
import { findFormOwner } from './form-owner.js';
import { getTreeRoot } from './owner-window.js';
import { useLatest } from './use-latest.js';

/** What a control does around a native reset besides applying it. */
export interface NativeResetOptions {
  /** Runs as the reset starts, before any listener on the form sees it. */
  onStart?: (() => void) | undefined;
  /** Runs once every listener has seen a reset one of them cancelled. */
  onCancel?: (() => void) | undefined;
}

/**
 * Runs `onReset` after a native reset of the form `ref`'s element takes part in (a reset button or
 * `form.reset()`), once every listener has seen the reset, and not for one a listener cancelled
 * with `preventDefault`. The form is the one the element takes part in when the reset happens, so a
 * control whose `form` attribute or enclosing form changes resets with its new owner only, and a
 * native control whose `form` names no form resets with none. Returns whether a reset is under way,
 * from the capture phase of the element's tree (its shadow root, else its document) until then, so a
 * control can hold the changes React Aria makes on the form's own reset listener, which runs before
 * a cancelling one.
 */
export function useNativeReset(
  ref: RefObject<Element | null>,
  onReset: () => void,
  options: NativeResetOptions = {},
): () => boolean {
  const latest = useLatest({ onReset, ...options });
  const isResetting = useRef(false);
  useEffect(() => {
    const element = ref.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return undefined;
    // A reset does not leave a shadow root, so the listener sits on the root of the element's tree.
    const root = getTreeRoot(element);
    let timer: number | undefined;
    // The tree root's capture phase sees the reset first; the timer runs after every listener.
    const onEvent = (event: Event) => {
      const current = ref.current;
      if (!current || event.target !== findFormOwner(current)) return;
      view.clearTimeout(timer);
      if (!isResetting.current) latest.current.onStart?.();
      isResetting.current = true;
      timer = view.setTimeout(() => {
        const handlers = latest.current;
        if (event.defaultPrevented) handlers.onCancel?.();
        isResetting.current = false;
        if (!event.defaultPrevented) handlers.onReset();
      }, 0);
    };
    root.addEventListener('reset', onEvent, true);
    return () => {
      view.clearTimeout(timer);
      isResetting.current = false;
      root.removeEventListener('reset', onEvent, true);
    };
  }, [ref, latest]);
  return () => isResetting.current;
}
