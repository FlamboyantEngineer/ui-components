import { isElement } from './is-element.js';

/** Fields and editable content, which use the arrow and character keys themselves. */
const editableSelector =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/**
 * Whether a key press at `target` belongs to the element it happens in: a field or editable content
 * (`contenteditable` with any value but `false`, including `""` and `plaintext-only`), or an
 * element matching `extraSelector`, such as a widget the caller drew (`'[role="slider"]'`). A
 * surrounding widget leaves such a key alone.
 */
export function isEditableTarget(target: EventTarget | null, extraSelector?: string): boolean {
  const selector = extraSelector ? `${extraSelector}, ${editableSelector}` : editableSelector;
  return isElement(target) && target.closest(selector) !== null;
}
