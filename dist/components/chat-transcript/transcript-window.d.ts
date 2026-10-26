/** The run of children near the viewport, by their first and last keys. */
export interface WindowRange {
    first: string;
    last: string;
}
/** Heights of the children a virtualized transcript has measured, and the window they give. */
export interface WindowModel {
    /** Records the gap spacers it renders, so measuring skips them. */
    spacerRef(element: HTMLElement | null): void;
    /** Whether an element is one of those gap spacers. */
    isSpacer(element: Element): boolean;
    /** Measures the mounted children, given their keys in order. */
    measure(feed: HTMLElement, mounted: readonly string[]): void;
    /** The children within one viewport height of the visible area. */
    range(viewport: HTMLElement, feed: HTMLElement, keys: readonly string[]): WindowRange | null;
    /** The height that stands in for the unmounted children from `start` up to `end`. */
    gapHeight(keys: readonly string[], start: number, end: number): number;
}
/** How many children the window holds before the viewport can be measured. */
export declare const INITIAL_WINDOW = 30;
/** The last `INITIAL_WINDOW` children, where a transcript starts. */
export declare function resolveTailRange(keys: readonly string[]): WindowRange | null;
/** Creates the model; children it has not measured count as the measured average. */
export declare function createWindowModel(): WindowModel;
/**
 * The indices to mount: the window's run plus the children that must stay mounted (the focused
 * message, the anchored one, the newest), in order.
 */
export declare function selectMounted(indexOf: ReadonlyMap<string, number>, range: WindowRange | null, forced: Iterable<string | null | undefined>): number[];
//# sourceMappingURL=transcript-window.d.ts.map