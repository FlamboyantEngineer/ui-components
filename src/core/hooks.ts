// Styling hooks (specs/HOOK-CONTRACT.md): root and slot classes plus data attributes.

/** A value a data attribute can carry. `true` renders `"true"`; `false`, `null` and `undefined` omit it. */
export type DataValue = string | number | boolean | null | undefined;

/** Data attributes keyed by their full attribute name. */
export type DataAttributes = { [attribute: `data-${string}`]: string | undefined };

/** Hook values keyed in camelCase (`variant`, `focusVisible`) or kebab-case. */
export type DataValues = Readonly<Record<string, DataValue>>;

/** Props spread on an element that carries hooks. */
export type HookProps = { className: string } & DataAttributes;

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

const kebabName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dataAttributeName = /^data-[a-z0-9]+(?:[-:_.][a-z0-9]+)*$/i;

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** Converts hook values to data attributes: `{ variant: 'primary', disabled: true }` → `data-variant`, `data-disabled`. */
export function dataAttributes(values: DataValues | undefined): DataAttributes {
  const attributes: DataAttributes = {};
  if (!values) return attributes;
  for (const [key, value] of Object.entries(values)) {
    if (value === false || value === null || value === undefined) continue;
    const name = key.startsWith('data-') ? key : `data-${toKebabCase(key)}`;
    attributes[name as `data-${string}`] = value === true ? 'true' : String(value);
  }
  return attributes;
}

/** Joins class names, skipping empty values. */
export function mergeClassNames(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

/** The caller's `data-*` props, to forward to a component's root element. */
export function pickDataAttributes(props: object): DataAttributes {
  const attributes: DataAttributes = {};
  for (const [key, value] of Object.entries(props)) {
    if (dataAttributeName.test(key) && (typeof value === 'string' || typeof value === 'number')) {
      attributes[key as `data-${string}`] = String(value);
    } else if (dataAttributeName.test(key) && value === true) {
      attributes[key as `data-${string}`] = 'true';
    }
  }
  return attributes;
}

/** Splits a props object into its `data-*` attributes and the rest. */
export function splitDataAttributes<P extends object>(
  props: P,
): [DataAttributes, Omit<P, `data-${string}`>] {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!dataAttributeName.test(key)) rest[key] = value;
  }
  return [pickDataAttributes(props), rest as Omit<P, `data-${string}`>];
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
export function createHooks<const Slot extends string = never>(
  name: string,
  slots: readonly Slot[] = [],
): ComponentHooks<Slot> {
  if (!kebabName.test(name)) throw new Error(`Invalid component hook name "${name}"`);
  for (const slot of slots) {
    if (!kebabName.test(slot)) throw new Error(`Invalid slot hook name "${name}__${slot}"`);
  }
  const rootClass = `ui-${name}`;
  const slotClass = (slot: Slot) => `${rootClass}__${slot}`;
  return {
    name,
    className: rootClass,
    root({ className, data, props } = {}) {
      return {
        ...(props ? pickDataAttributes(props) : {}),
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
export function measuredProperty(name: string, value: number | string): Record<string, string> {
  if (!kebabName.test(name)) throw new Error(`Invalid measured property name "--ui-${name}"`);
  return { [`--ui-${name}`]: typeof value === 'number' ? `${value}px` : value };
}
