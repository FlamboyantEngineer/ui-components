import type { Ref, RefCallback } from 'react';
type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
/** The props `mergeProps` returns: every key of every argument. */
export type MergedProps<T extends readonly object[]> = UnionToIntersection<T[number]>;
/**
 * One callback ref that hands the element to every ref given (objects and callbacks), and clears
 * them, or runs their React 19 cleanups, when the element leaves.
 */
export declare function mergeRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): RefCallback<T>;
/**
 * Merges props objects left to right. Handlers named `on` + a capital letter run in order,
 * `className`s are joined, `style` objects are merged, refs are combined with `mergeRefs`, and any
 * other prop comes from the last object that sets it to something other than `undefined`.
 */
export declare function mergeProps<T extends readonly object[]>(...props: T): MergedProps<T>;
export {};
//# sourceMappingURL=merge-props.d.ts.map