/** The end of a row that hidden items leave from: `end` keeps the first items, `start` the last. */
export type OverflowCollapseFrom = 'start' | 'end';
/** Sub-pixel slack, so rounding never hides an item that fits. */
export declare const tolerance = 0.5;
/** The container's content box. */
export declare function measureContentBox(container: HTMLElement): {
    width: number;
    height: number;
};
export interface OverflowCountInput {
    /** Each item's outer inline size, margins included. */
    sizes: readonly number[];
    /** The container's content-box inline size. */
    available: number;
    /** The space between neighbouring items and before the indicator. */
    gap: number;
    /** The indicator's outer inline size. */
    indicatorSize: number;
    collapseFrom?: OverflowCollapseFrom | undefined;
}
export interface MeasureCache {
    sizes: number[];
    indicatorSize: number;
    /** The container's content box at the last measurement. */
    room: {
        width: number;
        height: number;
    };
    /** Border-box widths of the observed elements, to ignore reports that change nothing. */
    observed: WeakMap<Element, number>;
    /** Consecutive corrections; a guard against a renderer whose indicator never settles. */
    corrections: number;
    /** The last commit's elements did not match its items yet; their renderer commits later. */
    isAwaitingChildren: boolean;
}
export interface RenderedItems<T> {
    visibleItems: readonly T[];
    hiddenItems: readonly T[];
    /** The positions in `items` of the visible items. */
    visibleIndices: readonly number[];
}
/**
 * How many items fit in a row of `available` pixels: all of them when they fit together, otherwise
 * as many as fit from the kept end beside the indicator.
 */
export declare function resolveOverflowCount(input: OverflowCountInput): number;
interface CommitMeasurement<T> {
    element: HTMLElement;
    itemContainer: HTMLElement | null;
    indicator: HTMLElement | null;
    measured: MeasureCache;
    items: readonly T[];
    rendered: RenderedItems<T>;
    order: readonly number[];
    collapseFrom: OverflowCollapseFrom;
    isStale: boolean;
}
/** Measures what this commit rendered and returns the visible count it leads to. */
export declare function measureCommit<T>(input: CommitMeasurement<T>): number | null;
export {};
//# sourceMappingURL=overflow-measure.d.ts.map