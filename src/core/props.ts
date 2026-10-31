// Props and option vocabularies shared by every component (docs/CODING-GUIDELINES.md).

import type { ComponentPropsWithRef, JSX, Ref } from 'react';

/**
 * A value a caller `data-*` attribute can carry. Strings, numbers and booleans render as text, as
 * React renders them (`false` as `"false"`); `null` and `undefined` omit the attribute. A
 * component's own hook values (`DataValue`) differ only for `false`, which omits theirs.
 */
export type DataAttributeValue = string | number | boolean | null | undefined;

/**
 * Props every component that renders an element accepts. Component props interfaces extend it
 * (with the shared prop groups in `events.ts`) instead of redeclaring these props.
 */
export interface BaseProps {
  /** Class names appended after the component's hook classes. */
  className?: string | undefined;
  /** The root element's id. */
  id?: string | undefined;
  /** Caller `data-*` attributes, forwarded to the root element as React renders them. */
  [data: `data-${string}`]: DataAttributeValue;
}

/**
 * The `ref` a component that renders a root element accepts. Props interfaces extend it, with the
 * root's element type, instead of declaring `ref` themselves.
 */
export interface RefProps<E extends Element> {
  /** The root element. */
  ref?: Ref<E> | undefined;
}

/**
 * The native props and ref of element `E` that a component forwards to it, without those
 * `BaseProps` declares and without `style`, which components never take from callers.
 */
export type NativeProps<E extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithRef<E>,
  keyof BaseProps | 'style'
>;

/**
 * The native props a container forwards to its element as they are (attributes, ARIA attributes,
 * handlers), for components whose spec says so (UIC-COMPOSITION-2.4). `dangerouslySetInnerHTML` is
 * left out: it would replace the content the component renders.
 */
export type ContainerProps<E extends keyof JSX.IntrinsicElements> = Omit<
  NativeProps<E>,
  'dangerouslySetInnerHTML'
>;

/** Block and box sizes. A component that offers fewer derives its own with `Extract<Size, …>`. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * How tightly a component packs its content, from `tight` to `comfortable`. `default` is the
 * baseline everywhere; a component takes the subset it draws.
 */
export type Density = 'tight' | 'compact' | 'default' | 'comfortable';

/** The sizes of single-line controls: every control of one size shares one height. */
export type ControlSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** A person's presence: what StatusLight, Avatar, UserIdentity and UserCard publish and name. */
export type PresenceStatus = 'active' | 'away' | 'busy' | 'idle';

/** Semantic tones for status, feedback and emphasis. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type Orientation = 'horizontal' | 'vertical';

/** Identifies an item in a collection (a menu item, a row, a tab, a tag). */
export type Key = string | number;

/** Selected keys, or `'all'` when every item is selected. */
export type Selection = 'all' | Set<Key>;

export type SelectionMode = 'none' | 'single' | 'multiple';

/** Where an overlay opens relative to its anchor: a side, then an alignment along it. */
export type Placement =
  | 'bottom'
  | 'bottom left'
  | 'bottom right'
  | 'bottom start'
  | 'bottom end'
  | 'top'
  | 'top left'
  | 'top right'
  | 'top start'
  | 'top end'
  | 'left'
  | 'left top'
  | 'left bottom'
  | 'start'
  | 'start top'
  | 'start bottom'
  | 'right'
  | 'right top'
  | 'right bottom'
  | 'end'
  | 'end top'
  | 'end bottom';

/** The interaction states an element hands to `render` or to custom content. */
export interface InteractionState {
  /** The pointer is over the element. */
  isHovered: boolean;
  /** The element is being pressed. */
  isPressed: boolean;
  /** The element has focus, from the keyboard or the pointer. */
  isFocused: boolean;
  /** The element has keyboard focus. */
  isFocusVisible: boolean;
  /** The element cannot be used. */
  isDisabled: boolean;
}

/** The interaction states of an element that can be selected: a tab, an option, a menu item. */
export interface SelectableState extends InteractionState {
  isSelected: boolean;
}

export type SortDirection = 'ascending' | 'descending';

/** The column a collection is sorted by and the direction. */
export interface SortDescriptor {
  column: Key;
  direction: SortDirection;
}
