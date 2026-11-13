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

/** Inputs that take no typed text: a press on one of them is a press on a button. */
const nonTextInputTypes = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'reset',
  'submit',
]);

/**
 * Whether a key press at `target` types into it: like `isEditableTarget`, without the inputs that
 * take no text (checkboxes, radios, buttons, files, colours), whose keys a shortcut may answer.
 */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!isElement(target)) return false;
  const editable = target.closest(editableSelector);
  if (!editable) return false;
  if (editable.localName !== 'input') return true;
  return !nonTextInputTypes.has((editable as HTMLInputElement).type);
}
