import { defineStrings } from '../message-format.js';
/** Strings of text diffs and annotation margins. */
interface DiffStrings {
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
  /** Names an annotation's marker in a margin of icons, by its place and the count. */
  annotationMarker: (index: number, total: number) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const diffStrings = defineStrings<DiffStrings>({
  textDiffSummary: (added, removed) => ({ added, removed }),
  textDiffLine: (change, oldNumber, newNumber) => ({
    change,
    oldNumber: String(oldNumber),
    newNumber: String(newNumber),
    hasOld: oldNumber !== null,
    hasNew: newNumber !== null,
  }),
  textDiffShowLines: (count) => ({ count }),
  annotationMarker: (index, total) => ({ index, total }),
});
