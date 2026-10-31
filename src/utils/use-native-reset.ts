'use client';

import { useEffect, type RefObject } from 'react';
import { useLatest } from './use-latest.js';

/** The form an element takes part in: its `form` owner when it has one, else the form around it. */
function findForm(element: Element): HTMLFormElement | null {
  const owner = 'form' in element ? (element.form as HTMLFormElement | null) : null;
  return owner ?? element.closest('form');
}

/**
 * Runs `onReset` after a native reset of the form `ref`'s element takes part in (a reset button or
 * `form.reset()`), once every listener has seen the reset, and not for one a listener cancelled
 * with `preventDefault`. The form is the one the element is in when it mounts.
 */
export function useNativeReset(ref: RefObject<Element | null>, onReset: () => void): void {
  const latest = useLatest(onReset);
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
      timer = view.setTimeout(() => {
        if (!event.defaultPrevented) latest.current();
      }, 0);
    };
    document.addEventListener('reset', onEvent, true);
    return () => {
      view.clearTimeout(timer);
      document.removeEventListener('reset', onEvent, true);
    };
  }, [ref, latest]);
}
