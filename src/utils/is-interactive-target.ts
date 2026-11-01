import { isElement } from './is-element.js';

/** Widget roles that own their presses and clicks, even as a roving item out of the tab order. */
const widgetRoles = [
  'button',
  'link',
  'checkbox',
  'switch',
  'radio',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'tab',
  'treeitem',
  'gridcell',
  'slider',
  'spinbutton',
  'scrollbar',
  'textbox',
  'searchbox',
  'combobox',
];

/**
 * The library's own pointer-driven surfaces, which carry no widget role and no tab stop: a number
 * field's slider track and thumbs (their `role="slider"` is on a hidden input inside) and its scrub
 * handle, a scroll region's overlay track and a signature pad's drawing surface. They handle the
 * pointer in the bubble phase, so a surrounding widget deciding in the capture phase, or from the
 * click that follows a drag, recognises them by their hook classes.
 */
const gestureSurfaces = [
  '.ui-number-field__track',
  '.ui-number-field__thumb',
  '.ui-number-field__scrubber',
  '.ui-scroll-region__track',
  '.ui-signature-pad__surface',
];

const ownerSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  ...widgetRoles.map((role) => `[role="${role}"]`),
  ...gestureSurfaces,
].join(', ');

/** Controls, editable content, gesture surfaces and anything focusable, a script's focus included. */
const interactiveSelector = `${ownerSelector}, [tabindex]`;

/**
 * Controls, editable content, gesture surfaces and tab stops: what owns a click, so a surrounding
 * click target (an actionable card) leaves it alone. An element focusable only by script
 * (`tabindex="-1"`, such as a heading focus moves to) does not own its clicks.
 */
export const clickOwnerSelector = `${ownerSelector}, [tabindex]:not([tabindex="-1"])`;

/**
 * Whether a press at `target` lands on a control, a gesture surface or editable content nested
 * inside `container`, which then owns the press: a surrounding widget starts no selection or drag
 * of its own. The container itself never counts, whatever its role.
 */
export function isInteractiveTarget(target: EventTarget | null, container: Element): boolean {
  if (!isElement(target)) return false;
  const control = target.closest(interactiveSelector);
  return control !== null && control !== container && container.contains(control);
}
