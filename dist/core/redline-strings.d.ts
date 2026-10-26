/** Strings of document redline compares and spreadsheet formula bars. */
export interface RedlineStrings {
    /** Default accessible name of a redline compare. */
    redlineComparison: string;
    /** Counts the blocks a redline compare adds, removes, changes and moves, or says none differ. */
    redlineSummary: (counts: {
        added: number;
        removed: number;
        changed: number;
        moved: number;
    }) => string;
    /** Names a block's kind, with a heading's level or a nested list item's depth. */
    redlineBlockType: (type: 'paragraph' | 'heading' | 'list-item' | 'quote' | 'code', level: number | null) => string;
    /** Names a redline row: how its block changed, then the block's kind. */
    redlineRow: (change: 'unchanged' | 'changed' | 'added' | 'removed' | 'moved-from' | 'moved-to', blockType: string) => string;
    /** Notes a block whose kind changed, from the names of its old and new kinds. */
    redlineTypeChange: (oldType: string, newType: string) => string;
    /** Notes a block whose text kept its words but changed its formatting. */
    redlineFormatChange: string;
    /** Moves from a moved block's old position to its new one. */
    redlineGoToNewPosition: string;
    /** Moves from a moved block's new position to its old one. */
    redlineGoToOldPosition: string;
    /** Moves to the previous change of a redline compare. */
    redlinePreviousChange: string;
    /** Moves to the next change of a redline compare. */
    redlineNextChange: string;
    /** Accepts one change. */
    redlineAccept: string;
    /** Rejects one change. */
    redlineReject: string;
    /** Names a formula bar. */
    formulaBar: string;
    /** Names the formula bar's box holding the active cell's reference. */
    formulaCellReference: string;
    /** Names the formula bar's input holding the active cell's content. */
    formulaCellContent: string;
    /** Says that a typed reference names no cell of the grid. */
    formulaInvalidReference: (text: string) => string;
    /** Labels the evaluated result of the content being edited. */
    formulaResult: string;
}
export declare const redlineStrings: RedlineStrings;
//# sourceMappingURL=redline-strings.d.ts.map