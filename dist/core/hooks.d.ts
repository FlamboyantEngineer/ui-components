/** A value a data attribute can carry. `true` renders `"true"`; `false`, `null` and `undefined` omit it. */
export type DataValue = string | number | boolean | null | undefined;
/** Data attributes keyed by their full attribute name. */
export type DataAttributes = {
    [attribute: `data-${string}`]: string | undefined;
};
/** Hook values keyed in camelCase (`variant`, `focusVisible`) or kebab-case. */
export type DataValues = Readonly<Record<string, DataValue>>;
/** Props spread on an element that carries hooks. */
export type HookProps = {
    className: string;
} & DataAttributes;
export interface RootHookOptions {
    /** The caller's class names, appended after the root class. */
    className?: string | undefined;
    /** Hook values the component writes. They win over caller attributes of the same name. */
    data?: DataValues | undefined;
    /** The caller's props; their `data-*` attributes are forwarded. */
    props?: object | undefined;
}
export interface ComponentHooks<Slot extends string> {
    /** The component name, e.g. `button`. */
    readonly name: string;
    /** The root class, e.g. `ui-button`. */
    readonly className: string;
    /** Props for the root element: root class, caller class, caller data attributes, then hook values. */
    root(options?: RootHookOptions): HookProps;
    /** Props for a slot element: `ui-<component>__<slot>` plus hook values. */
    slot(slot: Slot, data?: DataValues, className?: string): HookProps;
    /** The slot class, e.g. `ui-button__icon`. */
    slotClass(slot: Slot): string;
}
/** Converts hook values to data attributes: `{ variant: 'primary', disabled: true }` → `data-variant`, `data-disabled`. */
export declare function dataAttributes(values: DataValues | undefined): DataAttributes;
/** Joins class names, skipping empty values. */
export declare function mergeClassNames(...classNames: Array<string | false | null | undefined>): string;
/**
 * The caller's `data-*` props, to forward to a component's root element. Values render as React
 * renders a `data-*` prop: strings, numbers and booleans as text (`false` as `"false"`), while
 * `null` and `undefined` omit the attribute.
 */
export declare function pickDataAttributes(props: object): DataAttributes;
/** Splits a props object into its `data-*` attributes and the rest. */
export declare function splitDataAttributes<P extends object>(props: P): [DataAttributes, Omit<P, `data-${string}`>];
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
export declare function createHooks<const Slot extends string = never>(name: string, slots?: readonly Slot[]): ComponentHooks<Slot>;
/** A documented measured custom property (`--ui-<name>`), set inline by the component. */
export declare function measuredProperty(name: string, value: number | string): Record<string, string>;
//# sourceMappingURL=hooks.d.ts.map