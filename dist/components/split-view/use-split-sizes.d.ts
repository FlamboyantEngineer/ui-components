import { type SplitViewPane } from './split-layout.js';
export interface SplitSizesOptions {
    panes: readonly SplitViewPane[];
    /** Every pane's size (controlled). */
    sizes?: readonly number[] | undefined;
    defaultSizes?: readonly number[] | undefined;
    /** The first of two panes' size (controlled). */
    size?: number | undefined;
    defaultSize?: number | undefined;
    persistKey?: string | undefined;
    onSizesChange?: ((sizes: number[]) => void) | undefined;
    onSizesChangeEnd?: ((sizes: number[]) => void) | undefined;
    onSizeChange?: ((size: number) => void) | undefined;
    onSizeChangeEnd?: ((size: number) => void) | undefined;
    onCollapse?: ((index: number) => void) | undefined;
    onExpand?: ((index: number) => void) | undefined;
}
export type SplitSizesPhase = 'change' | 'end' | 'set';
export interface SplitSizes {
    /** Every pane's size, fitted to the panes. */
    current: readonly number[];
    /**
     * Applies new sizes: `change` live during a drag or a key step, `end` committed (and saved) when
     * it ends, `set` both at once.
     */
    update: (next: readonly number[], phase: SplitSizesPhase) => void;
    /** Collapses pane `index` if it can. */
    collapse: (index: number) => void;
    /** Opens collapsed pane `index` at its size before collapsing. */
    expand: (index: number) => void;
}
/**
 * The panes' sizes: the controlled `sizes` (or two-pane `size`), else the live sizes during a drag,
 * else the committed sizes, which persist. Collapsing and opening a pane are reported, and the size
 * a pane had before collapsing is kept to open it again.
 */
export declare function useSplitSizes(options: SplitSizesOptions): SplitSizes;
//# sourceMappingURL=use-split-sizes.d.ts.map