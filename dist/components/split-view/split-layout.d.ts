/** `percent`: a share of the space pixel panes leave. `pixel`: a fixed size the split keeps. */
export type SplitViewPaneUnit = 'percent' | 'pixel';
/** One pane of a resizable split. Sizes are in the pane's unit. */
export interface SplitViewPane {
    /** The pane element's id, named by the separators' `aria-controls`. Generated when omitted. */
    id?: string | undefined;
    /** The pane's smallest open size. Percent panes default to 10, pixel panes to 0. */
    minSize?: number | undefined;
    /** The pane's largest size. Percent panes default to 90; pixel panes have no limit. */
    maxSize?: number | undefined;
    /** `percent` (the default) or `pixel`, a fixed size kept while the split resizes. */
    unit?: SplitViewPaneUnit | undefined;
    /** The pane collapses below half its smallest size, on Enter on its separator, or on request. */
    collapsible?: boolean | undefined;
    /** The size of the collapsed pane. Defaults to 0. */
    collapsedSize?: number | undefined;
}
/** A separator of a split: the pane its value sizes, and the bounds of that value. */
export interface SplitSeparator {
    /** The pane the value sizes: a pixel pane beside the separator, else the pane before it. */
    sized: number;
    /** The pane on the other side, which takes the complement when both are percent panes. */
    partner: number;
    sizedPane: 'before' | 'after';
    /** The value is in pixels. */
    pixel: boolean;
    value: number;
    min: number;
    max: number;
}
/** Whether pane `index` is collapsed at `size`. */
export declare function isSplitPaneCollapsed(pane: SplitViewPane | undefined, size: number): boolean;
/** The pane that takes the space the others leave: the last percent pane, else the last pane. */
export declare function resolveFlexiblePane(panes: readonly SplitViewPane[]): number;
/**
 * Sizes fitted to the panes: each open pane within its bounds, a collapsed one at its collapsed
 * size, and the flexible pane taking what the other percent panes leave of 100. When that breaks
 * the flexible pane's bounds, the nearest percent panes before it give or take the difference, and
 * its smallest size wins over theirs.
 */
export declare function normalizeSplitSizes(panes: readonly SplitViewPane[], sizes: readonly number[]): number[];
/** The starting sizes: the given ones, else equal shares for percent panes and the smallest size for pixel panes. */
export declare function resolveInitialSplitSizes(panes: readonly SplitViewPane[], defaultSizes?: readonly number[] | null): number[];
/**
 * The separator between pane `index` and the next one. Between percent panes its value is the pane
 * before it, bounded by both panes (a collapsible pane may go down to its collapsed size); beside a
 * pixel pane its value is that pane's size, up to `available` pixels more (unlimited while the split
 * is unmeasured, up to the pane's largest size).
 */
export declare function resolveSplitSeparator(panes: readonly SplitViewPane[], sizes: readonly number[], { index, available }: {
    index: number;
    available: number;
}): SplitSeparator;
/**
 * The sizes after a separator moves to `value`: its sized pane takes the value, snapping shut below
 * half its smallest size, and a percent partner takes the complement, snapping shut the same way.
 */
export declare function applySplitSeparatorValue(panes: readonly SplitViewPane[], sizes: readonly number[], { index, available, value }: {
    index: number;
    available: number;
    value: number;
}): number[];
/**
 * The sizes with pane `index` collapsed; the neighbouring percent pane, after it when there is one,
 * takes the freed share. A pane that cannot collapse, or already has, keeps the sizes.
 */
export declare function collapseSplitPane(panes: readonly SplitViewPane[], sizes: readonly number[], index: number): readonly number[];
/**
 * The sizes with collapsed pane `index` open again at `size` (its smallest size by default, within
 * its bounds), taking the share from the neighbouring percent pane down to that pane's smallest size,
 * and further when the opened pane would stay below its own.
 */
export declare function expandSplitPane(panes: readonly SplitViewPane[], sizes: readonly number[], { index, size }: {
    index: number;
    size?: number | undefined;
}): readonly number[];
/**
 * A pane's inline flex basis: a pixel pane's size, a percent pane's share of the space the pixel
 * panes leave, and none for the flexible pane, which takes what remains.
 */
export declare function resolveSplitPaneBasis(panes: readonly SplitViewPane[], sizes: readonly number[], index: number): string | undefined;
//# sourceMappingURL=split-layout.d.ts.map