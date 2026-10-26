export const structureStrings = {
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
    treeChangedRow: (label, previous) => previous === null ? `${label}, changed` : `${label}, changed from ${previous}`,
    treeMovedAwayRow: (label) => `${label}, moved away`,
    treeMovedHereRow: (label) => `${label}, moved here`,
};
//# sourceMappingURL=structure-strings.js.map