// Styling hooks (specs/HOOK-CONTRACT.md): root and slot classes plus data attributes.
const kebabName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dataAttributeName = /^data-[a-z0-9]+(?:[-:_.][a-z0-9]+)*$/i;
function toKebabCase(key) {
    return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
function toAttributeName(key) {
    return key.startsWith('data-') ? key : `data-${toKebabCase(key)}`;
}
/** Converts hook values to data attributes: `{ variant: 'primary', disabled: true }` → `data-variant`, `data-disabled`. */
export function dataAttributes(values) {
    const attributes = {};
    if (!values)
        return attributes;
    for (const [key, value] of Object.entries(values)) {
        if (value === false || value === null || value === undefined)
            continue;
        attributes[toAttributeName(key)] = value === true ? 'true' : String(value);
    }
    return attributes;
}
/** Joins class names, skipping empty values. */
export function mergeClassNames(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
/**
 * The caller's `data-*` props, to forward to a component's root element. Values render as React
 * renders a `data-*` prop: strings, numbers and booleans as text (`false` as `"false"`), while
 * `null` and `undefined` omit the attribute.
 */
export function pickDataAttributes(props) {
    const attributes = {};
    for (const [key, value] of Object.entries(props)) {
        if (!dataAttributeName.test(key))
            continue;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            attributes[key] = String(value);
        }
    }
    return attributes;
}
/** Splits a props object into its `data-*` attributes and the rest. */
export function splitDataAttributes(props) {
    const rest = {};
    for (const [key, value] of Object.entries(props)) {
        if (!dataAttributeName.test(key))
            rest[key] = value;
    }
    return [pickDataAttributes(props), rest];
}
/**
 * Creates the hooks for one component. Slot names are declared up front so a typo is a type error.
 *
 * ```ts
 * const hooks = createHooks('button', ['icon', 'label']);
 * <button {...hooks.root({ className, props, data: { variant, size } })}>
 *   <span {...hooks.slot('label')}>{children}</span>
 * </button>
 * ```
 */
export function createHooks(name, slots = []) {
    if (!kebabName.test(name))
        throw new Error(`Invalid component hook name "${name}"`);
    for (const slot of slots) {
        if (!kebabName.test(slot))
            throw new Error(`Invalid slot hook name "${name}__${slot}"`);
    }
    const rootClass = `ui-${name}`;
    const slotClass = (slot) => `${rootClass}__${slot}`;
    return {
        name,
        className: rootClass,
        root({ className, data, props } = {}) {
            const attributes = props ? pickDataAttributes(props) : {};
            // Explicit empty values also clear caller attributes spread before these hooks.
            for (const key of Object.keys(data ?? {}))
                attributes[toAttributeName(key)] = undefined;
            return {
                ...attributes,
                ...dataAttributes(data),
                className: mergeClassNames(rootClass, className),
            };
        },
        slot(slot, data, className) {
            return { ...dataAttributes(data), className: mergeClassNames(slotClass(slot), className) };
        },
        slotClass,
    };
}
/** A documented measured custom property (`--ui-<name>`), set inline by the component. */
export function measuredProperty(name, value) {
    if (!kebabName.test(name))
        throw new Error(`Invalid measured property name "--ui-${name}"`);
    return { [`--ui-${name}`]: typeof value === 'number' ? `${value}px` : value };
}
//# sourceMappingURL=hooks.js.map