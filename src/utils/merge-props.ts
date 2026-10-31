// Merging props for an element several parties configure: a component's own props, hook props and
// the props a caller adds to a part it renders itself (specs/COMPOSITION.md).

import type { CSSProperties, Ref, RefCallback } from 'react';

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (
  value: infer I,
) => void
  ? I
  : never;

/** The props `mergeProps` returns: every key of every argument. */
export type MergedProps<T extends readonly object[]> = UnionToIntersection<T[number]>;

type AnyHandler = (...args: never[]) => unknown;

const handlerName = /^on[A-Z]/;

function setRef<T>(ref: Ref<T> | undefined, value: T | null): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  }
  if (!ref) return undefined;
  ref.current = value;
  return () => {
    ref.current = null;
  };
}

function chainHandlers(first: AnyHandler, second: AnyHandler): AnyHandler {
  return (...args) => {
    first(...args);
    return second(...args);
  };
}

function mergeValue(key: string, current: unknown, next: unknown): unknown {
  if (next === undefined) return current;
  if (current === undefined) return next;
  if (typeof current === 'function' && typeof next === 'function' && handlerName.test(key)) {
    return chainHandlers(current as AnyHandler, next as AnyHandler);
  }
  if (key === 'className' && typeof current === 'string' && typeof next === 'string') {
    return [current, next].filter(Boolean).join(' ');
  }
  if (key === 'style' && typeof current === 'object' && typeof next === 'object') {
    return { ...(current as CSSProperties), ...(next as CSSProperties) };
  }
  if (key === 'ref') return mergeRefs(current as Ref<unknown>, next as Ref<unknown>);
  return next;
}

/**
 * One callback ref that hands the element to every ref given (objects and callbacks), and clears
 * them, or runs their React 19 cleanups, when the element leaves.
 */
export function mergeRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): RefCallback<T> {
  return (value) => {
    const cleanups = refs.map((ref) => setRef(ref, value));
    return () => {
      for (const cleanup of cleanups) cleanup?.();
    };
  };
}

/**
 * Merges props objects left to right. Handlers named `on` + a capital letter run in order,
 * `className`s are joined, `style` objects are merged, refs are combined with `mergeRefs`, and any
 * other prop comes from the last object that sets it to something other than `undefined`.
 *
 * Two refs merge into a new callback each call, so merging them during render hands the element a
 * new ref every render, which React detaches and attaches again on each commit. A component that
 * merges its own ref with a caller's merges them once, with `useForwardedRef`, and passes one ref.
 */
export function mergeProps<T extends readonly object[]>(...props: T): MergedProps<T> {
  const merged: Record<string, unknown> = {};
  for (const source of props) {
    for (const [key, value] of Object.entries(source)) {
      merged[key] = mergeValue(key, merged[key], value);
    }
  }
  return merged as MergedProps<T>;
}
