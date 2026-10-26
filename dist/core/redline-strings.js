const typeNames = {
    paragraph: 'Paragraph',
    heading: 'Heading',
    'list-item': 'List item',
    quote: 'Quote',
    code: 'Code block',
};
const rowChanges = {
    unchanged: 'Unchanged',
    changed: 'Changed',
    added: 'Added',
    removed: 'Removed',
    'moved-from': 'Moved away',
    'moved-to': 'Moved here',
};
export const redlineStrings = {
    redlineComparison: 'Document comparison',
    redlineSummary: ({ added, removed, changed, moved }) => {
        const parts = [
            added > 0 ? `${added} added` : null,
            removed > 0 ? `${removed} removed` : null,
            changed > 0 ? `${changed} changed` : null,
            moved > 0 ? `${moved} moved` : null,
        ].filter((part) => part !== null);
        return parts.length === 0 ? 'No differences' : parts.join(', ');
    },
    redlineBlockType: (type, level) => {
        if (type === 'heading' && level !== null)
            return `Heading ${level}`;
        if (type === 'list-item' && level !== null && level > 1)
            return `List item, level ${level}`;
        return typeNames[type];
    },
    redlineRow: (change, blockType) => `${rowChanges[change]}: ${blockType}`,
    redlineTypeChange: (oldType, newType) => `${oldType} became ${newType}`,
    redlineFormatChange: 'Formatting changed',
    redlineGoToNewPosition: 'Go to new position',
    redlineGoToOldPosition: 'Go to old position',
    redlinePreviousChange: 'Previous change',
    redlineNextChange: 'Next change',
    redlineAccept: 'Accept',
    redlineReject: 'Reject',
    formulaBar: 'Formula bar',
    formulaCellReference: 'Cell reference',
    formulaCellContent: 'Cell content',
    formulaInvalidReference: (text) => `No cell named ${text}`,
    formulaResult: 'Result',
};
//# sourceMappingURL=redline-strings.js.map