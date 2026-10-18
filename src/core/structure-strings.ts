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

export const structureStrings: StructureStrings = {
  treeComparison: 'Comparison',
  treeChangesOnly: 'Only differences',
  treePreviousChange: 'Previous difference',
  treeNextChange: 'Next difference',
  treeGoToNewPosition: 'Go to new position',
  treeGoToOldPosition: 'Go to old position',
  treeNoDifferences: 'No differences',
  treeAddedCount: (count) => `${count} added`,
  treeRemovedCount: (count) => `${count} removed`,
  treeChangedCount: (count) => `${count} changed`,
  treeMovedCount: (count) => `${count} moved`,
  treeAddedRow: (label) => `${label}, added`,
  treeRemovedRow: (label) => `${label}, removed`,
  treeChangedRow: (label, previous) =>
    previous === null ? `${label}, changed` : `${label}, changed from ${previous}`,
  treeMovedAwayRow: (label) => `${label}, moved away`,
  treeMovedHereRow: (label) => `${label}, moved here`,
};
