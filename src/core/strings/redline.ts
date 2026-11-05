import { defineStrings, toSelectKey } from '../message-format.js';
/** Strings of document redline compares and spreadsheet formula bars. */
interface RedlineStrings {
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
  redlineBlockType: (
    type: 'paragraph' | 'heading' | 'list-item' | 'quote' | 'code',
    level: number | null,
  ) => string;
  /** Names a redline row: how its block changed, then the block's kind. */
  redlineRow: (
    change: 'unchanged' | 'changed' | 'added' | 'removed' | 'moved-from' | 'moved-to',
    blockType: string,
  ) => string;
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
  /** Describes the formula bar's content without its buttons: the keys that confirm and cancel. */
  formulaKeysHint: string;
  /** Names the formula bar's fₓ button, which lists functions to insert. */
  formulaFunctions: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const redlineStrings = defineStrings<RedlineStrings>({
  redlineSummary: ({ added, removed, changed, moved }) => ({
    added,
    removed,
    changed,
    moved,
    total: added + removed + changed + moved,
    addedAndMore: added > 0 && removed + changed + moved > 0,
    removedAndMore: removed > 0 && changed + moved > 0,
    changedAndMore: changed > 0 && moved > 0,
  }),
  redlineBlockType: (type, level) => ({ type: toSelectKey(type), level: level ?? 0 }),
  redlineRow: (change, blockType) => ({ change: toSelectKey(change), blockType }),
  redlineTypeChange: (oldType, newType) => ({ oldType, newType }),
  formulaInvalidReference: (text) => ({ text }),
});
