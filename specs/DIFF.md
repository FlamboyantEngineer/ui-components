# Diff

`diffLines` and `diffWords` compare two texts, and `diffSequences` two arrays of items, and return what changed as typed hunks: runs the texts share (`equal`), runs only the old text has (`delete`) and runs only the new text has (`insert`). They are pure functions with no dependency, written on Myers' shortest-edit algorithm with a search from both ends, so time grows with the texts' length times the number of differences and memory with the length alone. [Inline Text Diff](INLINE-TEXT-DIFF.md) builds its word changes on `diffWords`; hosts use them for line diffs, change lists and summaries. `mergeThreeWay` builds on the sequence diff to merge two texts that changed a common base.

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

The hunks shall keep as many lines in common as the texts allow (a longest common subsequence), list each change between two equal hunks as one delete followed by one insert, never hold two neighbours of the same kind or an empty hunk, and rebuild the old text from its equal and delete hunks and the new text from its equal and insert hunks. Texts that share a long start or end compare only their differing middles, and middles with no line in common, at any depth of the comparison, are one deletion and one insertion found in linear time, without searching for a path, so replacing twenty thousand lines with twenty thousand others takes well under a second; twenty thousand lines with scattered changes compare in under two seconds. The search for a shortest path is bounded: once it would make more than about fifty million token comparisons for one middle (never for texts under ten thousand lines or words in all), it stops and that middle becomes one deletion and one insertion, so very large texts that differ throughout produce a coarser but still correct diff instead of blocking the page. Recursive comparisons shall append to one edit list, and joining hunks shall append their tokens without repeatedly copying the accumulated run.

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

## UIC-DIFF-3 - Sequence diff

### UIC-DIFF-3.1 - Hunks of items

`diffSequences(oldItems, newItems)` shall compare two arrays of items with `===` (ids, keys, any primitive) and return the hunks (`SequenceDiffHunk`) in order, each with its `kind` and its `items`, under the rules of UIC-DIFF-1.3 applied to items: the equal and delete items joined give the old sequence, and the equal and insert items the new one. [Tree Compare](TREE-COMPARE.md) aligns sibling rows on it.

Implementation: `src/utils/diff.ts`
Verification: `src/utils/diff.test.ts`

## UIC-DIFF-4 - Three-way merge

### UIC-DIFF-4.1 - Chunks

`mergeThreeWay(base, ours, theirs)` shall compare each side with the base through the sequence diff of their lines (lines split as in UIC-DIFF-1.2) and return the merge as chunks (`MergeChunk`) in reading order, each with its `kind` and the `base`, `ours` and `theirs` lines of one run of the base: `unchanged` where neither side changed it, `ours` or `theirs` where only that side did, and `both` where the two sides made the same change. The chunks' base lines joined give the base, their `ours` lines our text and their `theirs` lines their text; two `unchanged` chunks never follow each other, and three empty texts give no chunk. The ordered change lists shall be traversed without removing their first elements, and a chunk may insert or delete two hundred thousand lines without exceeding the platform's function argument limit. [Merge View](MERGE-VIEW.md) draws them.

Implementation: `src/utils/three-way-merge.ts`, `src/utils/diff.ts`
Verification: `src/utils/three-way-merge.test.ts`

### UIC-DIFF-4.2 - Conflicts

Changes of the two sides shall join one `conflict` chunk when their base runs overlap, or when they touch and one of them only inserts lines (two insertions at one place, or an insertion right beside the other side's change), so their order would be a guess; a chain of such changes joins one chunk. A conflict's two sides always differ. Changes of neighbouring lines that replace lines on both sides stay separate clean chunks.

Implementation: `src/utils/three-way-merge.ts`
Verification: `src/utils/three-way-merge.test.ts`
