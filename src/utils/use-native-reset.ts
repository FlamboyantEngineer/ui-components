'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useLatest } from './use-latest.js';

/** The form an element takes part in: its `form` owner when it has one, else the form around it. */
function findForm(element: Element): HTMLFormElement | null {
  const owner = 'form' in element ? (element.form as HTMLFormElement | null) : null;
  return owner ?? element.closest('form');
}

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
 * with `preventDefault`. The form is the one the element is in when it mounts. Returns whether a
 * reset is under way, from the document's capture phase until then, so a control can hold the
 * changes React Aria makes on the form's own reset listener, which runs before a cancelling one.
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
    const form = element ? findForm(element) : null;
    const document = form?.ownerDocument;
    const view = document?.defaultView;
    if (!form || !document || !view) return undefined;
    let timer: number | undefined;
    // The document's capture phase sees the reset first; the timer runs after every listener.
    const onEvent = (event: Event) => {
      if (event.target !== form) return;
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
    document.addEventListener('reset', onEvent, true);
    return () => {
      view.clearTimeout(timer);
      isResetting.current = false;
      document.removeEventListener('reset', onEvent, true);
    };
  }, [ref, latest]);
  return () => isResetting.current;
}
