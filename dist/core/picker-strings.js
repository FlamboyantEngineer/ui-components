export const pickerStrings = {
    gridSizePicker: 'Table size',
    gridSize: (rows, columns) => `${rows} × ${columns}`,
    gridSizeCell: (rows, columns) => `${rows === 1 ? '1 row' : `${rows} rows`} by ${columns === 1 ? '1 column' : `${columns} columns`}`,
    characterGrid: 'Special characters',
    searchCharacters: 'Search characters',
    recentCharacters: 'Recently used',
    availableItems: 'Available',
    chosenItems: 'Chosen',
    noItems: 'No items',
    moveSelectedTo: (label) => `Move selected to ${label.toLocaleLowerCase()}`,
    moveAllTo: (label) => `Move all to ${label.toLocaleLowerCase()}`,
};
//# sourceMappingURL=picker-strings.js.map