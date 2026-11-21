// Styling hooks (specs/HOOK-CONTRACT.md): root and slot classes plus data attributes.

/**
 * A value a component's own hook attribute can carry. `true` renders `"true"`; `false`, `null` and
 * `undefined` omit it. Caller attributes (`DataAttributeValue`) render `false` as `"false"`.
 */
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

/**
 * shadcn/ui slot names (`data-slot`) for a component's root and slots, declared once beside the slot
 * list. Parts without a counterpart are left out and render no `data-slot`.
 */
type DataSlotNames<Slot extends string> = Partial<Record<'root' | Slot, string>>;

export interface ComponentHooks<Slot extends string> {
  /** The component name, e.g. `button`. */
  readonly name: string;
  /** The root class, e.g. `ui-button`. */
  readonly className: string;
  /** The declared slot names, e.g. `icon`. */
  readonly slots: readonly string[];
  /** Props for the root element: root class, caller class, caller data attributes, then hook values. */
  root(options?: RootHookOptions): HookProps;
  /** Props for a slot element: `ui-<component>__<slot>` plus hook values. */
  slot(slot: Slot, data?: DataValues, className?: string): HookProps;
  /** The slot class, e.g. `ui-button__icon`. */
  slotClass(slot: Slot): string;
  /** The declared shadcn/ui slot name of the root or a slot, e.g. `dialog-close`. */
  dataSlot(part: 'root' | Slot): string | undefined;
  /**
   * The same hooks with other `data-slot` names for the hook classes `names` lists (`null` drops
   * the name), so a presentation can name the shared parts it renders (`sheet-title`).
   */
  withDataSlots(names: DataSlotOverrides): ComponentHooks<Slot>;
}

/** `data-slot` names by hook class (`ui-dialog__title`); `null` renders no name. */
export type DataSlotOverrides = Readonly<Record<string, string | null>>;

const kebabName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dataSlotAttribute = 'data-slot';

// The declared data-slot name of every hook class, so a component given another's slot class as
// its className (`ui-dialog__close` on a Button) carries that part's name rather than its own.
const dataSlotByClass = new Map<string, string>();

/**
 * The declared shadcn/ui `data-slot` name of the first hook class in `className`, slot classes
 * first: for an element that is given a part's class without spreading the part's hooks.
 */
export function composedDataSlot(className: string | undefined): string | undefined {
  if (!className) return undefined;
  const tokens = className.split(/\s+/);
  const slotToken = tokens.find((token) => token.includes('__') && dataSlotByClass.has(token));
  const token = slotToken ?? tokens.find((token) => dataSlotByClass.has(token));
  return token === undefined ? undefined : dataSlotByClass.get(token);
}
const dataAttributeName = /^data-[a-z0-9]+(?:[-:_.][a-z0-9]+)*$/i;

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// Hook keys are a small fixed vocabulary, read on every render of every hooked element.
const attributeNames = new Map<string, `data-${string}`>();

function toAttributeName(key: string): `data-${string}` {
  let name = attributeNames.get(key);
  if (name === undefined) {
    name = key.startsWith('data-') ? (key as `data-${string}`) : `data-${toKebabCase(key)}`;
    attributeNames.set(key, name);
  }
  return name;
}

/** Converts hook values to data attributes: `{ variant: 'primary', disabled: true }` → `data-variant`, `data-disabled`. */
export function dataAttributes(values: DataValues | undefined): DataAttributes {
  const attributes: DataAttributes = {};
  if (values) writeDataAttributes(attributes, values, false);
  return attributes;
}

/** Writes hook values onto `attributes`; with `clearEmpty`, an empty value writes `undefined`. */
function writeDataAttributes(attributes: DataAttributes, values: DataValues, clearEmpty: boolean) {
  for (const key in values) {
    const value = values[key];
    const isEmpty = value === false || value === null || value === undefined;
    if (isEmpty && !clearEmpty) continue;
    attributes[toAttributeName(key)] = isEmpty
      ? undefined
      : value === true
        ? 'true'
        : String(value);
  }
}

/** Whether `key` is a valid `data-*` prop name; the cheap prefix test runs first. */
function isDataAttributeName(key: string): boolean {
  return key.startsWith('data-') && dataAttributeName.test(key);
}

/** Writes one caller `data-*` value as React renders it, skipping `null` and `undefined`. */
function writeDataAttribute(attributes: DataAttributes, key: string, value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    attributes[key as `data-${string}`] = String(value);
  }
}

/** Joins class names, skipping empty values. */
export function mergeClassNames(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

/**
 * The caller's `data-*` props, to forward to a component's root element. Values render as React
 * renders a `data-*` prop: strings, numbers and booleans as text (`false` as `"false"`), while
 * `null` and `undefined` omit the attribute.
 */
export function pickDataAttributes(props: object): DataAttributes {
  const attributes: DataAttributes = {};
  const values = props as Record<string, unknown>;
  for (const key in values) {
    if (isDataAttributeName(key) && Object.hasOwn(values, key)) {
      writeDataAttribute(attributes, key, values[key]);
    }
  }
  return attributes;
}

/** Splits a props object into its `data-*` attributes and the rest, in one pass. */
export function splitDataAttributes<P extends object>(
  props: P,
): [DataAttributes, Omit<P, `data-${string}`>] {
  const attributes: DataAttributes = {};
  const rest: Record<string, unknown> = {};
  const values = props as Record<string, unknown>;
  for (const key in values) {
    if (!Object.hasOwn(values, key)) continue;
    if (isDataAttributeName(key)) writeDataAttribute(attributes, key, values[key]);
    else rest[key] = values[key];
  }
  return [attributes, rest as Omit<P, `data-${string}`>];
}

/**
 * Creates the hooks for one component. Slot names are declared up front so a typo is a type error.
 * `dataSlots` gives the shadcn/ui `data-slot` names the root and slots carry. On the root, a
 * caller's own `data-slot` wins, then the name of a part class in the caller's `className`, so a
 * part that renders another component (`ui-dialog__close` on a Button) carries the part's name.
 *
 * ```ts
 * const hooks = createHooks('button', ['icon', 'label'], { root: 'button' });
 * <button {...hooks.root({ className, props, data: { variant, size } })}>
 *   <span {...hooks.slot('label')}>{children}</span>
 * </button>
 * ```
 */
export function createHooks<const Slot extends string = never>(
  name: string,
  slots: readonly Slot[] = [],
  dataSlots: DataSlotNames<Slot> = {},
): ComponentHooks<Slot> {
  if (!kebabName.test(name)) throw new Error(`Invalid component hook name "${name}"`);
  for (const slot of slots) {
    if (!kebabName.test(slot)) throw new Error(`Invalid slot hook name "${name}__${slot}"`);
  }
  for (const [part, slotName] of Object.entries(dataSlots)) {
    if (slotName !== undefined && !kebabName.test(slotName)) {
      throw new Error(`Invalid data-slot name "${slotName}" for ${name} ${part}`);
    }
  }
  const hooks = buildHooks(name, slots, dataSlots);
  const rootName = dataSlots.root;
  if (rootName !== undefined) dataSlotByClass.set(hooks.className, rootName);
  for (const slot of slots) {
    const slotName = dataSlots[slot];
    if (slotName !== undefined) dataSlotByClass.set(hooks.slotClass(slot), slotName);
  }
  return hooks;
}

/** The declared names with `names` applied to the classes it lists. */
function renameDataSlots<Slot extends string>(
  { rootClass, slots, dataSlots }: HookNames<Slot>,
  names: DataSlotOverrides,
): DataSlotNames<Slot> {
  const renamed: Partial<Record<'root' | Slot, string>> = {};
  const pick = (part: 'root' | Slot, hookClass: string) => {
    const value = Object.hasOwn(names, hookClass) ? names[hookClass] : dataSlots[part];
    if (typeof value === 'string') renamed[part] = value;
  };
  pick('root', rootClass);
  for (const slot of slots) pick(slot, `${rootClass}__${slot}`);
  return renamed;
}

interface HookNames<Slot extends string> {
  rootClass: string;
  slots: readonly Slot[];
  dataSlots: DataSlotNames<Slot>;
}

function buildHooks<Slot extends string>(
  name: string,
  slots: readonly Slot[],
  dataSlots: DataSlotNames<Slot>,
): ComponentHooks<Slot> {
  const rootClass = `ui-${name}`;
  const slotClass = (slot: Slot) => `${rootClass}__${slot}`;
  const dataSlot = (part: 'root' | Slot): string | undefined => dataSlots[part];
  return {
    name,
    className: rootClass,
    slots,
    root({ className, data, props } = {}) {
      const attributes: DataAttributes = props ? pickDataAttributes(props) : {};
      // A caller's data-slot, or a part class in its className, names a composed part; the
      // declared name names the component.
      const slotName =
        attributes[dataSlotAttribute] ?? composedDataSlot(className) ?? dataSlots.root;
      if (slotName !== undefined) attributes[dataSlotAttribute] = slotName;
      // Explicit empty values also clear caller attributes spread before these hooks.
      if (data) writeDataAttributes(attributes, data, true);
      return { ...attributes, className: mergeClassNames(rootClass, className) };
    },
    slot(slot, data, className) {
      const attributes: DataAttributes = {};
      const slotName = dataSlots[slot];
      if (slotName !== undefined) attributes[dataSlotAttribute] = slotName;
      // As on the root, explicit empty values clear caller attributes spread before these hooks.
      if (data) writeDataAttributes(attributes, data, true);
      return { ...attributes, className: mergeClassNames(slotClass(slot), className) };
    },
    slotClass,
    dataSlot,
    withDataSlots(names) {
      return buildHooks(name, slots, renameDataSlots({ rootClass, slots, dataSlots }, names));
    },
  };
}

/** A documented measured custom property (`--ui-<name>`), set inline by the component. */
export function measuredProperty(name: string, value: number | string): Record<string, string> {
  if (!kebabName.test(name)) throw new Error(`Invalid measured property name "--ui-${name}"`);
  return { [`--ui-${name}`]: typeof value === 'number' ? `${value}px` : value };
}
