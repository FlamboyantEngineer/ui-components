const editableSelector = 'input, textarea, select, [contenteditable]';

/**
 * Whether an event target sits in an element that takes its own keys: a text input, a select or
 * editable content, or an element matching `extraSelector`, such as a widget the caller drew.
 */
export function isEditableTarget(target: EventTarget | null, extraSelector?: string): boolean {
  const selector = extraSelector ? `${extraSelector}, ${editableSelector}` : editableSelector;
  return Boolean((target as Element | null)?.closest?.(selector));
}
