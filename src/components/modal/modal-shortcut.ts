import type { KeyboardEvent } from 'react';

interface ShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat?: boolean | undefined;
  isComposing?: boolean | undefined;
  defaultPrevented?: boolean | undefined;
}

// Key presses already seen by a modal; a modal opened inside another claims its own.
const claimedKeyEvents = new WeakSet<Event>();

/** Whether the key press comes from a multiline editor, where Control+Enter belongs to the editor. */
function isFromMultilineEditor(event: Event): boolean {
  return event.composedPath().some((target) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.tagName === 'TEXTAREA' || target.isContentEditable) return true;
    const editable = target.getAttribute('contenteditable');
    return (
      (editable !== null && editable !== 'false') ||
      target.getAttribute('aria-multiline') === 'true'
    );
  });
}

/**
 * Whether a key press is the modal's primary-action shortcut: Enter with exactly one of Control or
 * Command, no other modifier, not repeated, not composing text and not already handled.
 */
export function isModalPrimaryShortcut(event: ShortcutEvent): boolean {
  return (
    event.key === 'Enter' &&
    event.ctrlKey !== event.metaKey &&
    !event.altKey &&
    !event.shiftKey &&
    !event.repeat &&
    !event.isComposing &&
    !event.defaultPrevented
  );
}

/**
 * Claims a key press for the innermost modal that hears it, and tells whether it is the primary-
 * action shortcut pressed outside a multiline editor. A press another modal claimed is not.
 */
export function claimPrimaryShortcut(event: KeyboardEvent<HTMLElement>): boolean {
  const native = event.nativeEvent;
  if (claimedKeyEvents.has(native)) return false;
  claimedKeyEvents.add(native);
  return isModalPrimaryShortcut(native) && !isFromMultilineEditor(native);
}
