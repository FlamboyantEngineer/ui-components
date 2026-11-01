import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/** The parts of a key event that tell whether an input method composition owns it. */
export type CompositionKey = Pick<KeyboardEvent, 'isComposing' | 'keyCode'>;

/**
 * Whether a key belongs to an input method composition: pressed during it, or the Enter that
 * confirms a candidate, which some browsers report with key code 229 right after the composition
 * ends. Editors leave such keys to the input method instead of committing or cancelling on them.
 */
export function isComposingKey(event: CompositionKey): boolean {
  return event.isComposing || event.keyCode === 229;
}

/**
 * Whether an input event belongs to an input method composition: its text is provisional until the
 * composition ends, so a control keeps it as typed and acts on the text `compositionend` settles.
 */
export function isComposingInput(event: Event): boolean {
  return 'isComposing' in event && event.isComposing === true;
}

/**
 * A capture key handler for a text input whose Enter submits: an Enter that belongs to an input
 * method composition, including the key code 229 Enter that confirms a candidate, stops here, so
 * the input method keeps it and no submit, selection or enclosing form sees it.
 */
export function leaveComposingEnter(event: ReactKeyboardEvent) {
  if (event.key === 'Enter' && isComposingKey(event.nativeEvent)) event.stopPropagation();
}
