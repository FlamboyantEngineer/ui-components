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
