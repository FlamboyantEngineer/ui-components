/** Fields and widgets that use the arrow and character keys themselves. */
const keyOwners = 'input, textarea, select, [role="slider"]';

/**
 * Whether a key press at `target` belongs to the element it happens in: a field, a slider or
 * editable content (`contenteditable` with any value but `false`, including `""` and
 * `plaintext-only`), so a surrounding widget leaves the key alone.
 */
export function isKeyOwner(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  if (target.closest(keyOwners)) return true;
  const editable = target.closest('[contenteditable]');
  return editable !== null && editable.getAttribute('contenteditable') !== 'false';
}
