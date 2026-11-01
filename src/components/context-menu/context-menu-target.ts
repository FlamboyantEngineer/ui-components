'use client';

import { isFocused } from '../../utils/focus-target.js';
import {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type Ref,
  type RefCallback,
  type RefObject,
} from 'react';
import { mergeRefs } from '../../utils/merge-props.js';
import type { MenuController } from './menu-controller.js';
import { LONG_PRESS_DELAY } from '../../utils/overlay-defaults.js';
import { isHTMLElement } from '../../utils/is-element.js';

/** The props a context menu target receives; its own values are called first. */
export interface ContextMenuTargetProps {
  onContextMenu?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  onPointerDownCapture?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerMoveCapture?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerUpCapture?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerCancelCapture?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  ref?: Ref<HTMLElement> | undefined;
}

interface ContextMenuTargetOptions {
  controller: MenuController;
  isDisabled: boolean;
  /** Opens from Shift+F10 or the Context Menu key in a text control inside the target too. */
  opensFromTextKeys?: boolean | undefined;
  /** The target's own props, which keep working. */
  own: ContextMenuTargetProps;
  /** Receives the target element. */
  targetRef: RefObject<HTMLElement | null>;
}

/** How far a touch may travel and still count as resting, in pixels. */
const longPressTolerance = 10;

interface PendingPress {
  timer: ReturnType<typeof setTimeout>;
  pointerId: number;
  x: number;
  y: number;
}

/**
 * The innermost target each touch press reached. Targets see the press on its way in (capture), the
 * outermost first, so the last to write is the innermost: only it opens its menu, as a secondary
 * click stops at the innermost target.
 */
const pressOwners = new WeakMap<Event, Element>();

/** Input types whose text the reader edits, where the browser's own menu offers paste and spelling. */
const textInputTypes = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);

/** Whether `target` is a text control inside `owner` (not the owner itself), which keeps its own menu. */
function isTextInside(target: EventTarget, owner: Element): boolean {
  if (!isHTMLElement(target) || target === owner) return false;
  // Editable content counts when it starts inside the target; a target that is itself the editor,
  // or sits inside one, keeps its menu.
  const editable = target.closest('[contenteditable]:not([contenteditable="false"])');
  if (editable) return editable !== owner && owner.contains(editable);
  if (isHTMLElement(target, 'textarea')) return true;
  return isHTMLElement(target, 'input') && textInputTypes.has(target.type);
}

/** Whether an event reached the target from a portal it renders, such as its own open menu. */
function isFromPortal(event: { target: EventTarget; currentTarget: Element }): boolean {
  return !event.currentTarget.contains(event.target as Node);
}

function isKeyboardContextMenu(event: KeyboardEvent) {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
}

function hasMoved(press: PendingPress, event: PointerEvent) {
  return (
    event.pointerId === press.pointerId &&
    Math.hypot(event.clientX - press.x, event.clientY - press.y) > longPressTolerance
  );
}

/** Opens the menu at a point, focusing a focusable target first so focus returns to it on close. */
function openAt(controller: MenuController, element: HTMLElement, point: { x: number; y: number }) {
  if (element.tabIndex >= 0 && !isFocused(element)) {
    element.focus({ preventScroll: true });
  }
  controller.open(point);
}

/**
 * A touch resting on the target opens the menu there, for platforms that send no contextmenu event.
 * The press is watched on its way in (capture), so a pressable, a row or a gesture surface inside
 * the target that stops it on the way out still lets it through; whether something inside vetoed it
 * (prevented its default) or a nested target owns it is read when the delay ends, after every
 * handler has run.
 */
function useLongPress(options: ContextMenuTargetOptions, suppressUntil: RefObject<number>) {
  const { controller, isDisabled, own } = options;
  const pending = useRef<PendingPress | null>(null);
  const cancel = useCallback(() => {
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
  }, []);
  useEffect(() => cancel, [cancel, isDisabled]);
  return {
    cancel,
    onPointerDownCapture(event: PointerEvent<HTMLElement>) {
      own.onPointerDownCapture?.(event);
      cancel();
      if (isDisabled || event.pointerType !== 'touch' || isFromPortal(event)) return;
      if (isTextInside(event.target, event.currentTarget)) return;
      const { nativeEvent, clientX: x, clientY: y, pointerId, currentTarget } = event;
      pressOwners.set(nativeEvent, currentTarget);
      const timer = setTimeout(() => {
        pending.current = null;
        // A handler that prevented the press's default, or a nested target, keeps it.
        if (nativeEvent.defaultPrevented || pressOwners.get(nativeEvent) !== currentTarget) return;
        // The platform may still send its own contextmenu event for this press.
        suppressUntil.current = Date.now() + 1000;
        openAt(controller, currentTarget, { x, y });
      }, LONG_PRESS_DELAY);
      pending.current = { timer, pointerId, x, y };
    },
    onPointerMoveCapture(event: PointerEvent<HTMLElement>) {
      own.onPointerMoveCapture?.(event);
      if (pending.current && hasMoved(pending.current, event)) cancel();
    },
    onPointerUpCapture(event: PointerEvent<HTMLElement>) {
      own.onPointerUpCapture?.(event);
      cancel();
    },
    onPointerCancelCapture(event: PointerEvent<HTMLElement>) {
      own.onPointerCancelCapture?.(event);
      cancel();
    },
  };
}

/**
 * The handlers and ref that make an element a context menu target: a secondary click opens the
 * menu at the pointer, the Context Menu key or Shift+F10 below the element, a long touch at the
 * touch point. A secondary click, long touch or key on a text control inside the target keeps the
 * browser's own menu, which edits the text. A request whose default the target's own handler, or
 * one inside it, prevented opens nothing, whether a secondary click, a long touch or a key. Events
 * from a portal the target renders, such as its own open menu, open nothing.
 */
export function useContextMenuTarget(
  options: ContextMenuTargetOptions,
): ContextMenuTargetProps & { ref: RefCallback<HTMLElement> } {
  const { controller, isDisabled, opensFromTextKeys = false, own, targetRef } = options;
  const suppressUntil = useRef(0);
  const { cancel, ...pointerHandlers } = useLongPress(options, suppressUntil);
  const ownRef = own.ref;
  const ref = useMemo(() => mergeRefs(targetRef, ownRef), [ownRef, targetRef]);
  return {
    ...pointerHandlers,
    ref,
    onContextMenu(event) {
      own.onContextMenu?.(event);
      if (isDisabled || isFromPortal(event)) return;
      // The target or something inside it handled the request and kept the browser's menu away.
      if (event.defaultPrevented) {
        cancel();
        return;
      }
      const isSuppressed = Date.now() < suppressUntil.current;
      if (!isSuppressed && isTextInside(event.target, event.currentTarget)) return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
      if (isSuppressed) return;
      openAt(controller, event.currentTarget, { x: event.clientX, y: event.clientY });
    },
    onKeyDown(event) {
      own.onKeyDown?.(event);
      if (isDisabled || event.defaultPrevented || !isKeyboardContextMenu(event)) return;
      if (isFromPortal(event)) return;
      // A text control inside the target keeps the key for its own editing menu.
      if (!opensFromTextKeys && isTextInside(event.target, event.currentTarget)) return;
      event.preventDefault();
      event.stopPropagation();
      // The browser may follow the key with its own contextmenu event.
      suppressUntil.current = Date.now() + 600;
      controller.open(event.currentTarget);
    },
  };
}
