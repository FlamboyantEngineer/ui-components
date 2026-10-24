/** Fields and editable content, which use the arrow and character keys themselves. */
const editableSelector =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/**
 * Whether a key press at `target` belongs to the element it happens in: a field or editable content
 * (`contenteditable` with any value but `false`, including `""` and `plaintext-only`), or an
 * element matching `extraSelector` (appended to the selector, so it starts with a comma, such as
 * `', [role="slider"]'`). A surrounding widget leaves such a key alone.
 */
export function isEditableTarget(target: EventTarget | null, extraSelector = ''): boolean {
  return target instanceof Element && target.closest(editableSelector + extraSelector) !== null;
}
