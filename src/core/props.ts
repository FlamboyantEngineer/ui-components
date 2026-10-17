// Props and option vocabularies shared by every component (docs/CODING-GUIDELINES.md).

import type { ComponentPropsWithRef, JSX } from 'react';

/** A value a caller `data-*` attribute can carry. */
export type DataAttributeValue = string | number | boolean | undefined;

/**
 * Props every component that renders an element accepts. Component props interfaces extend it
 * (with React Aria's props where the component wraps one) instead of redeclaring these props.
 */
export interface BaseProps {
  /** Class names appended after the component's hook classes. */
  className?: string | undefined;
  /** The root element's id. */
  id?: string | undefined;
  /** Caller `data-*` attributes, forwarded to the root element. */
  [data: `data-${string}`]: DataAttributeValue;
}

/**
 * The native props and ref of element `E` that a component forwards to it, without those
 * `BaseProps` declares and without `style`, which components never take from callers.
 */
export type NativeProps<E extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithRef<E>,
  keyof BaseProps | 'style'
>;

/** Block and box sizes. A component that offers fewer derives its own with `Extract<Size, …>`. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Semantic tones for status, feedback and emphasis. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type Orientation = 'horizontal' | 'vertical';
