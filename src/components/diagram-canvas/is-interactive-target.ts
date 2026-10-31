import { isElement } from '../../utils/is-element.js';

/** Controls and editable content that handle their own presses and pointer drags. */
const interactiveSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
].join(', ');

/**
 * Whether a press at `target` lands on a control or editable content nested inside `container`,
 * which then owns the press: a surrounding widget starts no selection or drag of its own. The
 * container itself never counts, whatever its role.
 */
export function isInteractiveTarget(target: EventTarget | null, container: Element): boolean {
  if (!isElement(target)) return false;
  const control = target.closest(interactiveSelector);
  return control !== null && control !== container && container.contains(control);
}
