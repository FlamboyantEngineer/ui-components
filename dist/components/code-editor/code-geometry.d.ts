import type { CodeRange } from './code-ranges.js';
/** The text nodes of the highlighted copy in order, with the source offset each starts at. */
export interface CopyText {
    nodes: readonly Text[];
    starts: readonly number[];
    length: number;
}
/** Reads the copy's text nodes once, for every lookup until the copy renders again. */
export declare function readCopyText(root: Node): CopyText;
/** The on-screen rectangle of a range of the highlighted copy, or `null` when it cannot say. */
export declare function measureRange(copy: CopyText, range: CodeRange): DOMRect | null;
/**
 * The offset of the character under a point, found by bisecting the copy's characters in reading
 * order; `null` over no character, such as past the end of a line.
 */
export declare function findOffsetAt(copy: CopyText, x: number, y: number): number | null;
/** Scrolls the text area so a range of the copy is in view; the copy follows the text area. */
export declare function revealRange(input: HTMLElement, highlight: HTMLElement, range: CodeRange): void;
//# sourceMappingURL=code-geometry.d.ts.map