// The form a control belongs to, as the browser decides it for its own form controls.

import { isHTMLElement } from './is-element.js';

/** The elements whose native `form` property names their owner. */
const formAssociated = new Set([
  'button',
  'fieldset',
  'input',
  'object',
  'output',
  'select',
  'textarea',
]);

/** Whether the element is a native form-associated element, whose `form` is authoritative. */
export function hasNativeFormOwner(element: Element): element is HTMLInputElement {
  return isHTMLElement(element) && formAssociated.has(element.localName);
}

/**
 * The form `element` takes part in. A native form control's own `form` owner decides, even when it
 * is null (a `form` attribute naming no form): such a control belongs to no form. Any other element,
 * such as a group's root, takes part in the form around it.
 */
export function findFormOwner(element: Element): HTMLFormElement | null {
  return hasNativeFormOwner(element) ? element.form : element.closest('form');
}
