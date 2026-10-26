/** Where a revealed message sits: just into view, at the top, or in the middle. */
export type RevealAlignment = 'nearest' | 'start' | 'center';
/** The viewport's paddings, inside which the content starts and ends. */
export declare function readViewportPadding(viewport: HTMLElement): {
    top: number;
    bottom: number;
};
/** How far an element's top edge sits below the top of the viewport's padding box, in pixels. */
export declare function readOffset(element: Element, viewport: HTMLElement): number;
/** How far the viewport is from its bottom, in pixels. */
export declare function readDistanceToBottom(viewport: HTMLElement): number;
/** The scroll position that puts the element's top at the top of the viewport's content box. */
export declare function resolveTopAlignment(element: Element, viewport: HTMLElement): number;
/**
 * The scroll position that brings an element into view: its top at the top (`start`, and for an
 * element taller than the view), centred, or moved just far enough to show it whole (`nearest`).
 */
export declare function resolveReveal(element: Element, viewport: HTMLElement, align: RevealAlignment): number;
/**
 * The index of the first element whose bottom edge is below the viewport's top, among elements in
 * document order, or -1. Their edges only grow down the list, so the search halves it each step.
 */
export declare function findFirstVisible(elements: readonly Element[], viewport: HTMLElement): number;
/** The index of the last element whose top edge is above the viewport's bottom, or -1. */
export declare function findLastVisible(elements: readonly Element[], viewport: HTMLElement): number;
//# sourceMappingURL=transcript-geometry.d.ts.map