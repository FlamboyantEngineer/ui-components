// The rows a text diff draws: changes and unchanged runs from `diffLines`, word changes inside
// paired lines from `diffWords`, and unchanged runs folded down to their context.
import { diffLines, diffWords } from '../../utils/diff.js';
function toLine(change, numbers) {
    return (text) => {
        const key = `${change[0]}${change === 'added' ? numbers.new : numbers.old}`;
        const line = { change, oldNumber: numbers.old, newNumber: numbers.new, text, key, words: null };
        if (numbers.old !== null)
            numbers.old += 1;
        if (numbers.new !== null)
            numbers.new += 1;
        return line;
    };
}
function toWordParts(hunks, changed) {
    return hunks
        .filter((hunk) => hunk.kind === 'equal' || hunk.kind === changed)
        .map((hunk) => ({ text: hunk.text, isChanged: hunk.kind === changed }));
}
/**
 * Pairs the removed and added lines of a change in order and marks the words each pair changed,
 * unless the two lines share no word, where highlighting every word would say nothing.
 */
function pairWords(removed, added) {
    removed.forEach((line, index) => {
        const other = added[index];
        if (!other)
            return;
        const hunks = diffWords(line.text, other.text);
        if (!hunks.some((hunk) => hunk.kind === 'equal' && hunk.text.trim() !== ''))
            return;
        line.words = toWordParts(hunks, 'delete');
        other.words = toWordParts(hunks, 'insert');
    });
}
/**
 * Folds an unchanged block down to `context` lines beside each change; the start and end of the
 * text keep none. A block the reader opened, and every block of texts without a change, stay whole.
 */
function foldLines(block, blocks, { context, expanded }) {
    const { lines } = block;
    if (expanded.has(block.index) || blocks.length === 1)
        return { head: lines, hidden: [], tail: [] };
    const lead = block.index === 0 ? 0 : context;
    const trail = block.index === blocks.length - 1 ? 0 : context;
    if (lines.length <= lead + trail)
        return { head: lines, hidden: [], tail: [] };
    return {
        head: lines.slice(0, lead),
        hidden: lines.slice(lead, lines.length - trail),
        tail: lines.slice(lines.length - trail),
    };
}
function toFoldRow(block, hidden) {
    const first = hidden[0];
    if (!first)
        return [];
    return [{ kind: 'fold', key: `f${block}`, block, count: hidden.length, firstKey: first.key }];
}
/** The blocks of the line diff of two texts, changes numbered in order. */
export function createDiffBlocks(oldText, newText) {
    const blocks = [];
    let changes = 0;
    for (const hunk of diffLines(oldText, newText)) {
        const numbers = {
            old: hunk.kind === 'insert' ? null : hunk.oldStart,
            new: hunk.kind === 'delete' ? null : hunk.newStart,
        };
        if (hunk.kind === 'equal') {
            const lines = hunk.lines.map(toLine('unchanged', numbers));
            blocks.push({ kind: 'unchanged', index: blocks.length, lines });
            continue;
        }
        let last = blocks.at(-1);
        if (last?.kind !== 'change') {
            last = { kind: 'change', index: blocks.length, change: changes, removed: [], added: [] };
            changes += 1;
            blocks.push(last);
        }
        if (hunk.kind === 'delete')
            last.removed = hunk.lines.map(toLine('removed', numbers));
        else
            last.added = hunk.lines.map(toLine('added', numbers));
    }
    for (const block of blocks)
        if (block.kind === 'change')
            pairWords(block.removed, block.added);
    return blocks;
}
/** How many lines the texts add and remove, and in how many changes. */
export function countChanges(blocks) {
    const changes = blocks.filter((block) => block.kind === 'change');
    return {
        added: changes.reduce((sum, block) => sum + block.added.length, 0),
        removed: changes.reduce((sum, block) => sum + block.removed.length, 0),
        changes: changes.length,
    };
}
/** The rows of a unified diff: removed lines before added ones, unchanged runs folded. */
export function createUnifiedRows(blocks, options) {
    return blocks.flatMap((block) => {
        const line = (change) => (entry) => ({
            kind: 'line',
            key: entry.key,
            line: entry,
            change,
        });
        if (block.kind === 'change')
            return [...block.removed, ...block.added].map(line(block.change));
        const { head, hidden, tail } = foldLines(block, blocks, options);
        return [...head.map(line(null)), ...toFoldRow(block.index, hidden), ...tail.map(line(null))];
    });
}
/** The rows of a split diff: each change's lines side by side, unchanged runs folded. */
export function createSplitRows(blocks, options) {
    return blocks.flatMap((block) => {
        if (block.kind === 'change') {
            const length = Math.max(block.removed.length, block.added.length);
            return Array.from({ length }, (_, index) => {
                const old = block.removed[index] ?? null;
                const next = block.added[index] ?? null;
                return { kind: 'line', key: (old ?? next).key, old, new: next, change: block.change };
            });
        }
        const line = (entry) => ({
            kind: 'line',
            key: entry.key,
            old: entry,
            new: entry,
            change: null,
        });
        const { head, hidden, tail } = foldLines(block, blocks, options);
        return [...head.map(line), ...toFoldRow(block.index, hidden), ...tail.map(line)];
    });
}
//# sourceMappingURL=diff-rows.js.map