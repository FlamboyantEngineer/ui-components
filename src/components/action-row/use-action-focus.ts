'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import { createHooks } from '../../core/hooks.js';

const hooks = createHooks('action-row', ['action', 'overflow']);

const overflowSelector = `.${hooks.slotClass('overflow')} button`;
/** The buttons that can hold focus in the actions slot: the actions and the overflow menu's button. */
const buttonSelector = `.${hooks.slotClass('action')}, ${overflowSelector}`;

/** The focused button and the buttons around it, nearest first. */
interface FocusedAction {
  button: Element;
  following: Element[];
  preceding: Element[];
}

function findFocusedAction(root: HTMLElement, target: Element | null): FocusedAction | null {
  const buttons = [...root.querySelectorAll(buttonSelector)];
  const index = target ? buttons.indexOf(target) : -1;
  if (index === -1) return null;
  return {
    button: buttons[index] as Element,
    following: buttons.slice(index + 1),
    preceding: buttons.slice(0, index).reverse(),
  };
}

/**
 * Where focus goes when the focused button leaves: the next button still there, else the overflow
 * menu's button (the action may have moved into it), else the previous button.
 */
function findSuccessor(root: HTMLElement, previous: FocusedAction): Element | null {
  const isPresent = (button: Element) => button.isConnected;
  return (
    previous.following.find(isPresent) ??
    root.querySelector(overflowSelector) ??
    previous.preceding.find(isPresent) ??
    null
  );
}

/**
 * Keeps focus in the actions slot when the action holding it leaves the row or moves into the
 * overflow menu: focus moves to the next button, else the overflow menu's, else the previous one,
 * so it never falls to the page. Returns the slot's ref.
 */
export function useActionFocus() {
  const root = useRef<HTMLElement | null>(null);
  const focused = useRef<FocusedAction | null>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const document = element.ownerDocument;
    const previous = focused.current;
    const isLost = !document.activeElement || document.activeElement === document.body;
    if (previous && !previous.button.isConnected && isLost) {
      const next = findSuccessor(element, previous);
      if (next instanceof HTMLElement) next.focus();
    }
    // Buttons may have moved: take the neighbours again from this render.
    focused.current = findFocusedAction(element, document.activeElement);
  });
  // Native listeners, since a React Aria toolbar does not forward focus handlers.
  const ref = useCallback((element: HTMLElement | null) => {
    root.current = element;
    if (!element) return undefined;
    const onFocusIn = (event: FocusEvent) => {
      focused.current = findFocusedAction(element, event.target as Element | null);
    };
    // Focus moving elsewhere on the page forgets the action; an action leaving the page moves it nowhere.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !element.contains(next)) focused.current = null;
    };
    element.addEventListener('focusin', onFocusIn);
    element.addEventListener('focusout', onFocusOut);
    return () => {
      root.current = null;
      element.removeEventListener('focusin', onFocusIn);
      element.removeEventListener('focusout', onFocusOut);
    };
  }, []);
  return ref;
}
