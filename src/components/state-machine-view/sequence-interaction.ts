'use client';

// Context menu requests and selection reconciliation for the sequence presentation
// (specs/STATE-MACHINE-VIEW.md, UIC-STATE-MACHINE-VIEW-5).

import { useEffect, useRef } from 'react';
import type { PointerType } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';
import type { MenuAnchor } from '../context-menu/context-menu.js';
import type { StateMachineContextMenuEvent } from './state-machine-view.js';

/** The parts of a keyboard event a request reads, from React or from React Aria. */
interface MenuKeyEvent {
  key: string;
  shiftKey: boolean;
  currentTarget: EventTarget | null;
  preventDefault(): void;
}

interface MenuMouseEvent {
  target: EventTarget;
  clientX: number;
  clientY: number;
  currentTarget: EventTarget | null;
  nativeEvent: Event;
  preventDefault(): void;
}

interface ContextMenuRequestHandlers {
  onContextMenu?: ((event: MenuMouseEvent) => void) | undefined;
  onKeyDown?: ((event: MenuKeyEvent) => void) | undefined;
}

/** How long after a keyboard request the browser's own follow-up `contextmenu` belongs to it. */
const keyRequestWindow = 600;

/**
 * Keyboard requests by element: the browser may follow the Context Menu key or Shift+F10 with its own
 * `contextmenu` event, which repeats the request and is kept away only if the host took it.
 */
const keyRequests = new WeakMap<EventTarget, { until: number; isTaken: boolean }>();

export function isKeyboardContextMenu(event: Pick<MenuKeyEvent, 'key' | 'shiftKey'>): boolean {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
}

function readPointerType(event: Event): PointerType {
  const type = 'pointerType' in event ? event.pointerType : undefined;
  return type === 'touch' || type === 'pen' ? type : 'mouse';
}

function createMenuEvent(
  target: HTMLElement,
  anchor: MenuAnchor,
  pointerType: PointerType,
): StateMachineContextMenuEvent {
  let isPrevented = false;
  return {
    anchor,
    target,
    pointerType,
    preventDefault() {
      isPrevented = true;
    },
    get defaultPrevented() {
      return isPrevented;
    },
  };
}

/**
 * The handlers that turn a secondary click, the Context Menu key or Shift+F10 on an element into one
 * request: anchored at the pointer, or at the element from the keyboard. The browser's own menu
 * stays unless the host prevents the request's default.
 */
export function getContextMenuRequestHandlers(
  dispatch: ((event: StateMachineContextMenuEvent) => void) | undefined,
): ContextMenuRequestHandlers {
  if (!dispatch) return {};
  return {
    onContextMenu(event) {
      const target = event.currentTarget;
      if (!isHTMLElement(target)) return;
      // The follow-up event reaches the element the key was pressed on, then bubbles here.
      const pending = keyRequests.get(event.target) ?? keyRequests.get(target);
      keyRequests.delete(event.target);
      keyRequests.delete(target);
      if (pending && Date.now() < pending.until) {
        if (pending.isTaken) event.preventDefault();
        return;
      }
      const point = { x: event.clientX, y: event.clientY };
      const request = createMenuEvent(target, point, readPointerType(event.nativeEvent));
      dispatch(request);
      if (request.defaultPrevented) event.preventDefault();
    },
    onKeyDown(event) {
      const target = event.currentTarget;
      if (!isKeyboardContextMenu(event) || !isHTMLElement(target)) return;
      const request = createMenuEvent(target, target, 'keyboard');
      dispatch(request);
      keyRequests.set(target, {
        until: Date.now() + keyRequestWindow,
        isTaken: request.defaultPrevented,
      });
      if (request.defaultPrevented) event.preventDefault();
    },
  };
}

/**
 * Asks the owner to select nothing once the selected target, shown before, is removed or can no
 * longer be selected. A key that was never shown is left alone, so a host may select ahead of its
 * data; an owner that keeps the key is not asked again until the target returns and leaves again.
 */
export function useReleaseMissingSelection(
  key: Key | null | undefined,
  isAvailable: boolean,
  onChange: ((key: Key | null) => void) | undefined,
): void {
  const latest = useLatest(onChange);
  const wasAvailable = useRef<{ key: Key | null | undefined; isAvailable: boolean }>({
    key,
    isAvailable,
  });
  useEffect(() => {
    const previous = wasAvailable.current;
    wasAvailable.current = { key, isAvailable };
    if (key == null || isAvailable) return;
    if (previous.key === key && previous.isAvailable) latest.current?.(null);
  }, [key, isAvailable, latest]);
}
