'use client';

import { containsComposed, getComposedActiveElement, isFocused } from './focus-target.js';
import { isElement } from './is-element.js';
import { useCallback, useLayoutEffect, useRef } from 'react';

/** Finds the element a focus request moves focus to, once the edit that asked for it has rendered. */
type FocusRequestTarget = () => HTMLElement | null | undefined;

/** The most frames a focus request waits for its element to take focus. */
const focusRetryFrames = 60;

/** The collections that move their own focus as an edit changes them. */
const collectionSelector = '[role="grid"], [role="treegrid"], [role="listbox"], [role="tree"]';

/**
 * The collection around `element`, followed out of shadow roots, if any: one that may repair its
 * own focus, onto another of its items or itself, while an edit settles.
 */
function findCollection(element: Element | null): Element | null {
  let current: Element | null = element;
  while (current) {
    const found = current.closest(collectionSelector);
    if (found) return found;
    current = (current.getRootNode() as Partial<ShadowRoot>).host ?? null;
  }
  return null;
}

/**
 * Who owns focus while a request retries. Once the target has taken focus the request owns it only
 * against the edit settling: focus the collection around the element focused when the request
 * began, or around the target, moves onto one of its own items (or the page's body) is a repair
 * the next retry undoes. Focus that moves anywhere else, as when the application focuses another
 * control or a dialog opens, is a newer request, and `onYield` gives way to it.
 */
function watchFocusOwner(onYield: () => void) {
  let claimed = false;
  let current: HTMLElement | null = null;
  const repairs = new Set<Element>();
  const origin = findCollection(getComposedActiveElement(document));
  if (origin) repairs.add(origin);
  // The target's document, and the shadow root it lives in, which hears focus moves inside it.
  const roots = new Set<Node>();
  const onFocusIn = (event: Event) => {
    const [node] = event.composedPath();
    if (!claimed || !isElement(node) || node === current) return;
    for (const collection of repairs) if (containsComposed(collection, node)) return;
    onYield();
  };
  return {
    /** Notes the element the request is about to focus, whose own focus is no newer request. */
    follow(element: HTMLElement) {
      current = element;
      for (const root of [element.ownerDocument, element.getRootNode()]) {
        if (roots.has(root)) continue;
        roots.add(root);
        root.addEventListener('focusin', onFocusIn, true);
      }
    },
    /** Takes ownership once the element holds focus, after the request focused it. */
    claim(element: HTMLElement) {
      if (claimed || !isFocused(element)) return;
      claimed = true;
      const collection = findCollection(element);
      if (collection) repairs.add(collection);
    },
    release() {
      for (const root of roots) root.removeEventListener('focusin', onFocusIn, true);
      roots.clear();
    },
  };
}

/** One focus request's retries, which yield to a newer focus request (see `watchFocusOwner`). */
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
    focusOwner.release();
  };
  const focusOwner = watchFocusOwner(stop);
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
    const wasHeld = Boolean(element && element === previous && isFocused(element));
    if (element) {
      if (owner !== element.ownerDocument) listen(element.ownerDocument);
      focusOwner.follow(element);
      if (!isFocused(element)) element.focus();
      focusOwner.claim(element);
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
 * Moves focus to the element `target` finds now, retrying on the next frames until it holds focus,
 * as a request does. Returns a function that stops the retries.
 */
export function focusWithRetry(target: FocusRequestTarget): () => void {
  const current = createFocusAttempt(target);
  current.attempt();
  return current.stop;
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
    cancel.current = focusWithRetry(target);
  });
  return useCallback((target: FocusRequestTarget) => {
    cancel.current();
    request.current = target;
  }, []);
}
