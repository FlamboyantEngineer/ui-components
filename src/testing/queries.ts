import { getReferencedElement } from './tree-scope.js';

const slotClassPattern = /^ui-[a-z0-9]+(?:-[a-z0-9]+)*__([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** The control that carries the field's description references: `field` itself or its first descendant. */
function findDescribedControl(field: Element): Element | null {
  return field.hasAttribute('aria-describedby') ? field : field.querySelector('[aria-describedby]');
}

/** The elements the field's control names in `aria-describedby`, in order, in its own tree. */
function describedBy(field: Element): HTMLElement[] {
  const control = findDescribedControl(field);
  const ids = control?.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  return ids
    .map((id) => (control && id ? getReferencedElement(control, id) : null))
    .filter((element): element is HTMLElement => element !== null);
}

function hasSlot(element: Element, slots: readonly string[]): boolean {
  return [...element.classList].some((token) =>
    slots.includes(slotClassPattern.exec(token)?.[1] ?? ''),
  );
}

function readText(element: Element | undefined): string | null {
  const text = element?.textContent?.trim();
  return text ? text : null;
}

/**
 * The element carrying the hook class `ui-<component>`, or `ui-<component>__<slot>` when `slot` is
 * given: `root` itself or its first descendant. Throws when none is rendered.
 */
export function getHookElement(root: Element, component: string, slot?: string): HTMLElement {
  const hook = slot === undefined ? `ui-${component}` : `ui-${component}__${slot}`;
  const element = root.classList.contains(hook) ? root : root.querySelector(`.${hook}`);
  if (!element) throw new Error(`No element with the hook class ${hook} is rendered.`);
  return element as HTMLElement;
}

/**
 * The error message a field's control announces (its `aria-describedby` element in an `__error` or
 * `__message` slot, warnings excluded), or `null` while it has none. `field` is the field's root or
 * its control.
 */
export function getFieldError(field: Element): string | null {
  return readText(
    describedBy(field).find(
      (element) => hasSlot(element, ['error', 'message']) && element.dataset.severity !== 'warning',
    ),
  );
}

/**
 * The description a field's control announces (its `aria-describedby` element in a `__description`
 * slot), or `null` when it has none. `field` is the field's root or its control.
 */
export function getFieldDescription(field: Element): string | null {
  return readText(describedBy(field).find((element) => hasSlot(element, ['description'])));
}
