import type { UiStrings } from '../../core/strings.js';
import type { BlockChangeCounts, DocumentBlock } from '../../utils/compare-blocks.js';
import type { RedlineWords } from './redline-text.js';
export declare const redlineCompareHooks: import("../../core/hooks.js").ComponentHooks<"header" | "mark" | "summary" | "marker" | "columns" | "row" | "rows" | "previous" | "next" | "actions" | "reject" | "cell" | "navigation" | "note" | "block" | "accept" | "word" | "column-label" | "jump" | "notes">;
/** The name of a block's kind, with its level where the kind has one. */
export declare function nameBlockType(block: DocumentBlock, strings: UiStrings): string;
/** A block's text on one side: kept words as they are, added words in `<ins>`, removed in `<del>`. */
export declare function RedlineBlock({ block, words }: {
    block: DocumentBlock;
    words: RedlineWords[];
}): import("react").JSX.Element;
/** The counts of changed blocks and the buttons that move between changes. */
export declare function RedlineCompareHeader(props: {
    counts: BlockChangeCounts;
    canMove: {
        previous: boolean;
        next: boolean;
    };
    onMove: (step: 1 | -1) => void;
}): import("react").JSX.Element;
/** The labels over the two columns of a split compare, which the cells' content already conveys. */
export declare function RedlineCompareColumns({ labels }: {
    labels: {
        old: string;
        new: string;
    };
}): import("react").JSX.Element;
declare const markerGlyphs: {
    readonly changed: "edit";
    readonly added: "plus";
    readonly removed: "minus";
    readonly moved: "move";
};
/** The row's change glyph and its spoken description, which also describes its buttons. */
export declare function RedlineMarker(props: {
    change: keyof typeof markerGlyphs | 'unchanged';
    label: string;
    labelId: string;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=redline-compare-parts.d.ts.map