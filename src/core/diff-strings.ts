/** Strings of text diffs and annotation margins. */
export interface DiffStrings {
  /** The lines a text diff adds and removes, by their counts. */
  textDiffSummary: (added: number, removed: number) => string;
  /** Names one line of a text diff: how it changed, then its old and new numbers where it has them. */
  textDiffLine: (
    change: 'added' | 'removed' | 'unchanged',
    oldNumber: number | null,
    newNumber: number | null,
  ) => string;
  /** Reveals the unchanged lines a text diff folds away, by their count. */
  textDiffShowLines: (count: number) => string;
  /** Moves to the previous change of a text diff. */
  textDiffPreviousChange: string;
  /** Moves to the next change of a text diff. */
  textDiffNextChange: string;
  /** Names the lines of a unified text diff. */
  textDiffLines: string;
  /** Names the list of annotation cards in a margin. */
  annotations: string;
}

const linesText = (count: number) => (count === 1 ? '1 line' : `${count} lines`);

const changeNames = { added: 'Added', removed: 'Removed', unchanged: 'Unchanged' } as const;

export const diffStrings: DiffStrings = {
  textDiffSummary: (added, removed) => `${linesText(added)} added, ${linesText(removed)} removed`,
  textDiffLine: (change, oldNumber, newNumber) =>
    [
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
