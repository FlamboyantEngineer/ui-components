import { isComposingKey, type CompositionKey } from './is-composing-key.js';

/** The parts of a key event that tell whether a control may edit on it. */
export type EditKey = CompositionKey &
  Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'defaultPrevented'>;

/**
 * Whether a key press is free for a control's own keyboard edits: not part of an input method
 * composition, not already handled, and without Alt, Control or Meta, which the browser and the
 * application keep for navigation and shortcuts. Shift is left to the control, which may document
 * it as an edit.
 */
export function isFreeEditKey(event: EditKey): boolean {
  return (
    !isComposingKey(event) &&
    !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  );
}
