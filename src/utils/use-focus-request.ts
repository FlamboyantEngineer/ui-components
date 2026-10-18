import { useEffect, useLayoutEffect, useRef } from 'react';

/** Finds the element a focus request moves focus to, once the edit that asked for it has rendered. */
export type FocusRequestTarget = () => HTMLElement | null | undefined;

/** The most frames a focus request waits for its element to take focus. */
const focusRetryFrames = 60;

/**
 * Returns `request(target)`, which moves focus to the element `target` finds after the next render,
 * for editors that add, remove or move the element being edited. An edit made from a menu runs
 * while the menu still makes the rest of the page inert, and a collection may move its rows a frame
 * after the edit, so focus is retried on the next frames until the element holds it.
 */
export function useFocusRequest(): (target: FocusRequestTarget) => void {
  const request = useRef<FocusRequestTarget | null>(null);
  const cancel = useRef(() => {});
  useLayoutEffect(() => {
    const target = request.current;
    if (!target) return;
    request.current = null;
    cancel.current();
    let frame = 0;
    let attempts = 0;
    // The reader acting again (opening the next menu, typing elsewhere) ends the request, so a
    // pending retry never takes focus back from where the reader moved it.
    const stop = () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', stop, true);
      document.removeEventListener('keydown', stop, true);
    };
    cancel.current = stop;
    document.addEventListener('pointerdown', stop, true);
    document.addEventListener('keydown', stop, true);
    const attempt = () => {
      const element = target();
      if (element && document.activeElement !== element) element.focus();
      attempts += 1;
      // A collection may redraw its rows once more after the render: check again on the next frame.
      const isHeld = document.activeElement === element && attempts > 1;
      if (element && !isHeld && attempts < focusRetryFrames) frame = requestAnimationFrame(attempt);
      else stop();
    };
    attempt();
  });
  useEffect(() => () => cancel.current(), []);
  return (target) => {
    request.current = target;
  };
}
