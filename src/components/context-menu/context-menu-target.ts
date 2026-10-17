import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type Ref,
  type RefObject,
} from 'react';
import type { MenuController } from './menu-controller.js';

/** The props a context menu target receives; its own values are called first. */
export interface ContextMenuTargetProps {
  onContextMenu?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  onPointerDown?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerMove?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerUp?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerCancel?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  ref?: Ref<HTMLElement> | undefined;
}

export interface ContextMenuTargetOptions {
  controller: MenuController;
  isDisabled: boolean;
  /** The target's own props, which keep working. */
  own: ContextMenuTargetProps;
  /** Receives the target element. */
  targetRef: RefObject<HTMLElement | null>;
}

const longPressDelay = 500;
/** How far a touch may travel and still count as resting, in pixels. */
const longPressTolerance = 10;

interface PendingPress {
  timer: ReturnType<typeof setTimeout>;
  pointerId: number;
  x: number;
  y: number;
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
  if (element.tabIndex >= 0 && element.ownerDocument.activeElement !== element) {
    element.focus({ preventScroll: true });
  }
  controller.open(point);
}

/** A touch resting on the target opens the menu there, for platforms that send no contextmenu event. */
function useLongPress(options: ContextMenuTargetOptions, suppressUntil: RefObject<number>) {
  const { controller, isDisabled, own } = options;
  const pending = useRef<PendingPress | null>(null);
  const cancel = useCallback(() => {
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);
  return {
    cancel,
    onPointerDown(event: PointerEvent<HTMLElement>) {
      own.onPointerDown?.(event);
      cancel();
      if (isDisabled || event.pointerType !== 'touch') return;
      const { clientX: x, clientY: y, pointerId, currentTarget } = event;
      const timer = setTimeout(() => {
        pending.current = null;
        // The platform may still send its own contextmenu event for this press.
        suppressUntil.current = Date.now() + 1000;
        openAt(controller, currentTarget, { x, y });
      }, longPressDelay);
      pending.current = { timer, pointerId, x, y };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      own.onPointerMove?.(event);
      if (pending.current && hasMoved(pending.current, event)) cancel();
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      own.onPointerUp?.(event);
      cancel();
    },
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      own.onPointerCancel?.(event);
      cancel();
    },
  };
}

/**
 * The handlers and ref that make an element a context menu target: a secondary click opens the
 * menu at the pointer, the Context Menu key or Shift+F10 below the element, a long touch at the
 * touch point.
 */
export function useContextMenuTarget(options: ContextMenuTargetOptions): ContextMenuTargetProps {
  const { controller, isDisabled, own, targetRef } = options;
  const suppressUntil = useRef(0);
  const { cancel, ...pointerHandlers } = useLongPress(options, suppressUntil);
  const ownRef = own.ref;
  const ref = useCallback(
    (node: HTMLElement | null) => {
      targetRef.current = node;
      if (typeof ownRef === 'function') ownRef(node);
      else if (ownRef) ownRef.current = node;
    },
    [ownRef, targetRef],
  );
  return {
    ...pointerHandlers,
    ref,
    onContextMenu(event) {
      own.onContextMenu?.(event);
      if (isDisabled) return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
      if (Date.now() < suppressUntil.current) return;
      openAt(controller, event.currentTarget, { x: event.clientX, y: event.clientY });
    },
    onKeyDown(event) {
      own.onKeyDown?.(event);
      if (isDisabled || event.defaultPrevented || !isKeyboardContextMenu(event)) return;
      event.preventDefault();
      event.stopPropagation();
      // The browser may follow the key with its own contextmenu event.
      suppressUntil.current = Date.now() + 600;
      controller.open(event.currentTarget);
    },
  };
}
