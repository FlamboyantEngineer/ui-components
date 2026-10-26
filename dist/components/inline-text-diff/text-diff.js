// Pure text comparison for InlineTextDiff: one contiguous change, or every changed word run.
import { diffWords } from '../../utils/diff.js';
function shorten(value, limit, keepEnd) {
    const characters = Array.from(value);
    if (characters.length <= limit)
        return value;
    // Nothing kept, so no ellipsis either (`slice(-0)` would keep everything).
    if (limit <= 0)
        return '';
    return keepEnd
        ? `…${characters.slice(-limit).join('')}`
        : `${characters.slice(0, limit).join('')}…`;
}
/**
 * Splits two values around their one contiguous change: the longest common prefix and suffix are
 * kept, and the middle of each value is what was removed and added. Compares by code point.
 */
export function splitTextDiff(before, after) {
    const left = Array.from(before);
    const right = Array.from(after);
    let start = 0;
    while (start < left.length && start < right.length && left[start] === right[start])
        start += 1;
    let end = 0;
    while (start + end < left.length &&
        start + end < right.length &&
        left[left.length - 1 - end] === right[right.length - 1 - end]) {
        end += 1;
    }
    return {
        prefix: right.slice(0, start).join(''),
        removed: left.slice(start, left.length - end).join(''),
        added: right.slice(start, right.length - end).join(''),
        suffix: end > 0 ? right.slice(-end).join('') : '',
    };
}
/**
 * Segments for `InlineTextDiff` showing the change from `before` to `after`, with the unchanged
 * context and each changed run cut to a bounded length (marked with an ellipsis). Empty segments
 * are left out, so a first value is one added run and a cleared value one removed run.
 */
export function createInlineTextDiffExcerpt(before, after, { context = 24, run = 100 } = {}) {
    const parts = splitTextDiff(before, after);
    const segments = [
        { kind: 'text', text: shorten(parts.prefix, context, true) },
        { kind: 'removed', text: shorten(parts.removed, run, false) },
        { kind: 'added', text: shorten(parts.added, run, false) },
        { kind: 'text', text: shorten(parts.suffix, context, false) },
    ];
    return segments.filter((segment) => segment.text.length > 0);
}
/**
 * Segments for `InlineTextDiff` showing every changed run of words from `before` to `after`
 * (`diffWords`), whole and in reading order: each change's removed run before its added run.
 */
export function createInlineWordDiff(before, after) {
    const kinds = { equal: 'text', delete: 'removed', insert: 'added' };
    return diffWords(before, after).map((hunk) => ({ kind: kinds[hunk.kind], text: hunk.text }));
}
//# sourceMappingURL=text-diff.js.map