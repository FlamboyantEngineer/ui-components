/**
 * The element carrying the hook class `ui-<component>`, or `ui-<component>__<slot>` when `slot` is
 * given: `root` itself or its first descendant. Throws when none is rendered.
 */
export declare function getHookElement(root: Element, component: string, slot?: string): HTMLElement;
/**
 * The error message a field's control announces (its `aria-describedby` element in an `__error` or
 * `__message` slot, warnings excluded), or `null` while it has none. `field` is the field's root or
 * its control.
 */
export declare function getFieldError(field: Element): string | null;
/**
 * The description a field's control announces (its `aria-describedby` element in a `__description`
 * slot), or `null` when it has none. `field` is the field's root or its control.
 */
export declare function getFieldDescription(field: Element): string | null;
//# sourceMappingURL=queries.d.ts.map