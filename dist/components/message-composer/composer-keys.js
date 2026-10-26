// The composer's own keys: the send chord, Escape in edit mode and the arrows that recall.
import { useSyncExternalStore } from 'react';
const coarsePointer = '(pointer: coarse)';
function readCoarsePointer() {
    return typeof window.matchMedia === 'function' && window.matchMedia(coarsePointer).matches;
}
function subscribeToPointer(onChange) {
    if (typeof window.matchMedia !== 'function')
        return () => undefined;
    const query = window.matchMedia(coarsePointer);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
}
/** Whether a key sends: Ctrl+Enter or Cmd+Enter always, Enter alone with the Enter chord. */
function isSubmitKey(event, shortcut) {
    if (event.key !== 'Enter' || event.altKey || event.shiftKey || isComposingKey(event)) {
        return false;
    }
    return event.ctrlKey || event.metaKey || shortcut === 'Enter';
}
function toRecallDirection(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) {
        return null;
    }
    if (event.key === 'ArrowUp')
        return 'older';
    return event.key === 'ArrowDown' ? 'newer' : null;
}
/**
 * Whether a key is part of an input method composition: during it, or the Enter that some
 * browsers report (as key code 229) right after it ends.
 */
export function isComposingKey(event) {
    return event.isComposing || event.keyCode === 229;
}
/** Whether the primary pointer is coarse (a touch screen), followed as it changes. */
export function useCoarsePointer() {
    return useSyncExternalStore(subscribeToPointer, readCoarsePointer, () => false);
}
/** The chord that sends: on a touch screen Enter breaks the line, so Ctrl+Enter sends. */
export function resolveSubmitShortcut(shortcut, isCoarsePointer) {
    return isCoarsePointer ? 'Ctrl+Enter' : (shortcut ?? 'Enter');
}
/**
 * Runs the composer's own key: the send chord, Escape to cancel an edit, and the arrows that
 * recall earlier messages; returns whether it used the key.
 */
export function runComposerKey(event, actions) {
    if (isSubmitKey(event, actions.shortcut)) {
        actions.submit();
        return true;
    }
    if (event.key === 'Escape' && actions.isEditing && !event.isComposing) {
        actions.onCancel?.();
        return true;
    }
    const direction = toRecallDirection(event);
    return direction ? actions.recall(direction) : false;
}
//# sourceMappingURL=composer-keys.js.map