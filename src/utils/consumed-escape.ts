/** The parts of a key event an overlay reads to tell whether its content already handled Escape. */
type EscapeEvent = Pick<KeyboardEvent, 'key' | 'defaultPrevented' | 'stopPropagation'>;

/**
 * Stops an Escape that the overlay's content already handled (its `preventDefault`) at the
 * overlay's dialog, so React Aria's overlay above does not dismiss it anyway; an inner editor can
 * then cancel its own edit without knowing it sits in an overlay. Returns whether it stopped one.
 */
export function stopConsumedEscape(event: EscapeEvent): boolean {
  if (event.key !== 'Escape' || !event.defaultPrevented) return false;
  event.stopPropagation();
  return true;
}
