# Diff

`diffLines` and `diffWords` compare two texts and return what changed as typed hunks: runs the texts share (`equal`), runs only the old text has (`delete`) and runs only the new text has (`insert`). They are pure functions with no dependency, written on Myers' shortest-edit algorithm with a search from both ends, so time grows with the texts' length times the number of differences and memory with the length alone. [Inline Text Diff](INLINE-TEXT-DIFF.md) builds its word changes on `diffWords`; hosts use them for line diffs, change lists and summaries.

## UIC-DIFF-1 - Line diff

### UIC-DIFF-1.1 - Hunks with line numbers

`diffLines(oldText, newText)` shall return the hunks (`LineDiffHunk`) in reading order, each with its `kind`, its `lines` (without line breaks) and the 1-based numbers its first line has, or would have, in the old text (`oldStart`) and the new text (`newStart`), so a delete's `newStart` and an insert's `oldStart` name the line the change sits before. Two empty texts give no hunk, an empty old text one insert, an empty new text one delete, and equal texts one equal hunk.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`

### UIC-DIFF-1.2 - Lines

A text shall split into lines at `\n`, `\r\n` and `\r`, and a final line break shall end the last line rather than start an empty one, so `"one\n"` and `"one"` are one equal line while `"one\n\n"` adds an empty line.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`

### UIC-DIFF-1.3 - Shortest edit

The hunks shall keep as many lines in common as the texts allow (a longest common subsequence), list each change between two equal hunks as one delete followed by one insert, never hold two neighbours of the same kind or an empty hunk, and rebuild the old text from its equal and delete hunks and the new text from its equal and insert hunks. Texts that share a long start or end compare only their differing middles, and twenty thousand lines with scattered changes compare in under two seconds.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`

## UIC-DIFF-2 - Word diff

### UIC-DIFF-2.1 - Hunks of text

`diffWords(oldText, newText)` shall return the hunks (`WordDiffHunk`) in reading order, each with its `kind` and its `text`, under the rules of UIC-DIFF-1.3 applied to words: the equal and delete texts joined give the old text, and the equal and insert texts the new text.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`

### UIC-DIFF-2.2 - Words

`diffWords` shall compare whole tokens: a word (a run of letters, combining marks, digits and underscores in any script), a run of spaces, or one punctuation mark or symbol. A word that changed by one letter is deleted and inserted whole.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`

### UIC-DIFF-2.3 - Changes joined across spaces

A shared run of only spaces between two changes shall join them into one change, so `quick brown` replaced by `slow red` reads as one delete and one insert rather than two pairs around a shared space.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`
