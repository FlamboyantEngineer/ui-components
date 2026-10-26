const SLOT_CLASS = /^ui-[a-z0-9]+(?:-[a-z0-9]+)*__([a-z0-9]+(?:-[a-z0-9]+)*)$/;
/** The control that carries the field's description references: `field` itself or its first descendant. */
function findDescribedControl(field) {
    return field.hasAttribute('aria-describedby') ? field : field.querySelector('[aria-describedby]');
}
/** The elements the field's control names in `aria-describedby`, in order. */
function describedBy(field) {
    const ids = findDescribedControl(field)?.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
    return ids
        .map((id) => field.ownerDocument.getElementById(id))
        .filter((element) => element !== null);
}
function hasSlot(element, slots) {
    return [...element.classList].some((token) => slots.includes(SLOT_CLASS.exec(token)?.[1] ?? ''));
}
function readText(element) {
    const text = element?.textContent?.trim();
    return text ? text : null;
}
/**
 * The element carrying the hook class `ui-<component>`, or `ui-<component>__<slot>` when `slot` is
 * given: `root` itself or its first descendant. Throws when none is rendered.
 */
export function getHookElement(root, component, slot) {
    const hook = slot === undefined ? `ui-${component}` : `ui-${component}__${slot}`;
    const element = root.classList.contains(hook) ? root : root.querySelector(`.${hook}`);
    if (!element)
        throw new Error(`No element with the hook class ${hook} is rendered.`);
    return element;
}
/**
 * The error message a field's control announces (its `aria-describedby` element in an `__error` or
 * `__message` slot, warnings excluded), or `null` while it has none. `field` is the field's root or
 * its control.
 */
export function getFieldError(field) {
    return readText(describedBy(field).find((element) => hasSlot(element, ['error', 'message']) && element.dataset.severity !== 'warning'));
}
/**
 * The description a field's control announces (its `aria-describedby` element in a `__description`
 * slot), or `null` when it has none. `field` is the field's root or its control.
 */
export function getFieldDescription(field) {
    return readText(describedBy(field).find((element) => hasSlot(element, ['description'])));
}
//# sourceMappingURL=queries.js.map