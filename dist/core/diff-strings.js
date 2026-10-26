const linesText = (count) => (count === 1 ? '1 line' : `${count} lines`);
const changeNames = { added: 'Added', removed: 'Removed', unchanged: 'Unchanged' };
export const diffStrings = {
    textDiffSummary: (added, removed) => `${linesText(added)} added, ${linesText(removed)} removed`,
    textDiffLine: (change, oldNumber, newNumber) => [
        changeNames[change],
        oldNumber === null ? null : `old line ${oldNumber}`,
        newNumber === null ? null : `new line ${newNumber}`,
    ]
        .filter((part) => part !== null)
        .join(', '),
    textDiffShowLines: (count) => `Show ${count === 1 ? '1 more line' : `${count} more lines`}`,
    textDiffPreviousChange: 'Previous change',
    textDiffNextChange: 'Next change',
    textDiffLines: 'Lines',
    annotations: 'Annotations',
};
//# sourceMappingURL=diff-strings.js.map