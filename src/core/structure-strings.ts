import type { MessageArguments } from './message-format.js';
/** Strings of structure comparisons. */
export interface StructureStrings {
  /** Default accessible name of a tree comparison. */
  treeComparison: string;
  /** Names the switch that hides the rows without differences. */
  treeChangesOnly: string;
  /** Moves to the previous difference. */
  treePreviousChange: string;
  /** Moves to the next difference. */
  treeNextChange: string;
  /** Moves from a moved node's old position to its new one. */
  treeGoToNewPosition: string;
  /** Moves from a moved node's new position to its old one. */
  treeGoToOldPosition: string;
  /** What a comparison without differences shows. */
  treeNoDifferences: string;
  /** Counts the added nodes. */
  treeAddedCount: (count: number) => string;
  /** Counts the removed nodes. */
  treeRemovedCount: (count: number) => string;
  /** Counts the changed nodes. */
  treeChangedCount: (count: number) => string;
  /** Counts the moved nodes. */
  treeMovedCount: (count: number) => string;
  /** Names an added row, from its label. */
  treeAddedRow: (label: string) => string;
  /** Names a removed row, from its label. */
  treeRemovedRow: (label: string) => string;
  /** Names a changed row, from its new label and its old one when that differs. */
  treeChangedRow: (label: string, previous: string | null) => string;
  /** Names the old position of a moved node, from its label. */
  treeMovedAwayRow: (label: string) => string;
  /** Names the new position of a moved node, from its label. */
  treeMovedHereRow: (label: string) => string;
}

/** The message values each text function reads its arguments as. */
export const structureArguments: MessageArguments<StructureStrings> = {
  treeAddedCount: (count) => ({ count }),
  treeRemovedCount: (count) => ({ count }),
  treeChangedCount: (count) => ({ count }),
  treeMovedCount: (count) => ({ count }),
  treeAddedRow: (label) => ({ label }),
  treeRemovedRow: (label) => ({ label }),
  treeChangedRow: (label, previous) => ({ label, previous, hasPrevious: previous !== null }),
  treeMovedAwayRow: (label) => ({ label }),
  treeMovedHereRow: (label) => ({ label }),
};
