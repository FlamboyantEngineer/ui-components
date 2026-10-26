import { useCallback, useEffect, useRef, } from 'react';
const longPressDelay = 500;
/** How far a touch may travel and still count as resting, in pixels. */
const longPressTolerance = 10;
/** Input types whose text the reader edits, where the browser's own menu offers paste and spelling. */
const textInputTypes = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);
/** Whether `target` is a text control inside `owner` (not the owner itself), which keeps its own menu. */
function isTextInside(target, owner) {
    if (!(target instanceof HTMLElement) || target === owner)
        return false;
    if (target.isContentEditable || target instanceof HTMLTextAreaElement)
        return true;
    return target instanceof HTMLInputElement && textInputTypes.has(target.type);
}
function isKeyboardContextMenu(event) {
    return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
}
function hasMoved(press, event) {
    return (event.pointerId === press.pointerId &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > longPressTolerance);
}
/** Opens the menu at a point, focusing a focusable target first so focus returns to it on close. */
function openAt(controller, element, point) {
    if (element.tabIndex >= 0 && element.ownerDocument.activeElement !== element) {
        element.focus({ preventScroll: true });
    }
    controller.open(point);
}
/** A touch resting on the target opens the menu there, for platforms that send no contextmenu event. */
function useLongPress(options, suppressUntil) {
    const { controller, isDisabled, own } = options;
    const pending = useRef(null);
    const cancel = useCallback(() => {
        if (pending.current)
            clearTimeout(pending.current.timer);
        pending.current = null;
    }, []);
    useEffect(() => cancel, [cancel, isDisabled]);
    return {
        cancel,
        onPointerDown(event) {
            own.onPointerDown?.(event);
            cancel();
            if (isDisabled || event.pointerType !== 'touch')
                return;
            if (isTextInside(event.target, event.currentTarget))
                return;
            const { clientX: x, clientY: y, pointerId, currentTarget } = event;
            const timer = setTimeout(() => {
                pending.current = null;
                // The platform may still send its own contextmenu event for this press.
                suppressUntil.current = Date.now() + 1000;
                openAt(controller, currentTarget, { x, y });
            }, longPressDelay);
            pending.current = { timer, pointerId, x, y };
        },
        onPointerMove(event) {
            own.onPointerMove?.(event);
            if (pending.current && hasMoved(pending.current, event))
                cancel();
        },
        onPointerUp(event) {
            own.onPointerUp?.(event);
            cancel();
        },
        onPointerCancel(event) {
            own.onPointerCancel?.(event);
            cancel();
        },
    };
}
/**
 * The handlers and ref that make an element a context menu target: a secondary click opens the
 * menu at the pointer, the Context Menu key or Shift+F10 below the element, a long touch at the
 * touch point. A secondary click or long touch on a text control inside the target keeps the
 * browser's own menu, which edits the text.
 */
export function useContextMenuTarget(options) {
    const { controller, isDisabled, own, targetRef } = options;
    const suppressUntil = useRef(0);
    const { cancel, ...pointerHandlers } = useLongPress(options, suppressUntil);
    const ownRef = own.ref;
    const ref = useCallback((node) => {
        targetRef.current = node;
        if (typeof ownRef === 'function')
            ownRef(node);
        else if (ownRef)
            ownRef.current = node;
    }, [ownRef, targetRef]);
    return {
        ...pointerHandlers,
        ref,
        onContextMenu(event) {
            own.onContextMenu?.(event);
            if (isDisabled)
                return;
            const isSuppressed = Date.now() < suppressUntil.current;
            if (!isSuppressed && isTextInside(event.target, event.currentTarget))
                return;
            event.preventDefault();
            event.stopPropagation();
            cancel();
            if (isSuppressed)
                return;
            openAt(controller, event.currentTarget, { x: event.clientX, y: event.clientY });
        },
        onKeyDown(event) {
            own.onKeyDown?.(event);
            if (isDisabled || event.defaultPrevented || !isKeyboardContextMenu(event))
                return;
            event.preventDefault();
            event.stopPropagation();
            // The browser may follow the key with its own contextmenu event.
            suppressUntil.current = Date.now() + 600;
            controller.open(event.currentTarget);
        },
    };
}
//# sourceMappingURL=context-menu-target.js.map