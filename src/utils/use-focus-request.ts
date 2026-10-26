import { useCallback, useLayoutEffect, useRef } from 'react';

/** Finds the element a focus request moves focus to, once the edit that asked for it has rendered. */
export type FocusRequestTarget = () => HTMLElement | null | undefined;

/** The most frames a focus request waits for its element to take focus. */
const focusRetryFrames = 60;

function createFocusAttempt(target: FocusRequestTarget) {
  let active = true;
  let owner = document;
  let frame: { view: Window; id: number } | null = null;
  let attempts = 0;
  let held = 0;
  let previous: HTMLElement | null = null;
  const stop = () => {
    active = false;
    if (frame) frame.view.cancelAnimationFrame(frame.id);
    frame = null;
    owner.removeEventListener('pointerdown', stop, true);
    owner.removeEventListener('keydown', stop, true);
  };
  const listen = (document: Document) => {
    owner.removeEventListener('pointerdown', stop, true);
    owner.removeEventListener('keydown', stop, true);
    owner = document;
    owner.addEventListener('pointerdown', stop, true);
    owner.addEventListener('keydown', stop, true);
  };
  const attempt = () => {
    frame = null;
    if (!active) return;
    const element = target();
    if (!active) return;
    const wasHeld = Boolean(element && element === previous && owner.activeElement === element);
    if (element) {
      if (owner !== element.ownerDocument) listen(element.ownerDocument);
      if (owner.activeElement !== element) element.focus();
    }
    held = wasHeld ? held + 1 : 0;
    previous = element ?? null;
    attempts += 1;
    if (!active) return;
    // Moving collections can repair their previous focus for two frames after an edit.
    if (held >= 2 || attempts >= focusRetryFrames) return stop();
    const view = owner.defaultView ?? window;
    frame = { view, id: view.requestAnimationFrame(attempt) };
  };
  listen(owner);
  return { attempt, stop };
}

/**
 * Returns `request(target)`, which moves focus to the element `target` finds after the next render,
 * for editors that add, remove or move the element being edited. An edit made from a menu runs
 * while the menu still makes the rest of the page inert, and a collection may move its rows a frame
 * after the edit, so focus is retried on the next frames until the element holds it.
 */
export function useFocusRequest(): (target: FocusRequestTarget) => void {
  const request = useRef<FocusRequestTarget | null>(null);
  const cancel = useRef(() => {});
  useLayoutEffect(() => () => cancel.current(), []);
  useLayoutEffect(() => {
    const target = request.current;
    if (!target) return;
    request.current = null;
    cancel.current();
    const current = createFocusAttempt(target);
    cancel.current = current.stop;
    current.attempt();
  });
  return useCallback((target: FocusRequestTarget) => {
    cancel.current();
    request.current = target;
  }, []);
}
