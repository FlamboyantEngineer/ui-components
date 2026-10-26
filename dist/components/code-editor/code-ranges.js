// Ranges of the source a code editor marks: diagnostics, matching brackets and search matches.
import { escapeRegExp } from '../../utils/escape-regexp.js';
import { findLineStarts } from '../../utils/find-line-starts.js';
const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    ')': '(',
    ']': '[',
    '}': '{',
};
const opening = new Set(['(', '[', '{']);
/** Token types whose text is not code, so their brackets do not count. */
const textTypes = new Set(['string', 'key', 'comment']);
const word = /[\w$]+/y;
function lineBounds(value, line, starts) {
    const start = starts[line - 1];
    if (start === undefined)
        return null;
    return { start, end: starts[line] === undefined ? value.length : starts[line] - 1 };
}
/** The offset of a line and column counted from 1, kept within the line. */
function offsetAt(bounds, column) {
    if (!bounds)
        return null;
    return Math.min(bounds.end, bounds.start + Math.max(0, column - 1));
}
/** At least one character: the word at `start`, or the character before a line end. */
function spanAt(value, start, lineStart) {
    word.lastIndex = start;
    const length = word.exec(value)?.[0].length ?? 0;
    if (length > 0)
        return { start, end: start + length };
    if (start < value.length && value[start] !== '\n')
        return { start, end: start + 1 };
    return start > lineStart ? { start: start - 1, end: start } : null;
}
/**
 * The source a diagnostic marks: from its column to `endLine` and `endColumn`, or else the word at
 * its column; the line's text when it has no column. `null` when it has no line or nothing to mark.
 */
export function findDiagnosticRange(value, diagnostic, starts = findLineStarts(value)) {
    const { line, column, endLine, endColumn } = diagnostic;
    if (line === undefined)
        return null;
    const bounds = lineBounds(value, line, starts);
    if (!bounds)
        return null;
    if (column === undefined) {
        const indent = /^\s*/.exec(value.slice(bounds.start, bounds.end))?.[0].length ?? 0;
        return bounds.start + indent < bounds.end
            ? { start: bounds.start + indent, end: bounds.end }
            : null;
    }
    const start = Math.min(bounds.end, bounds.start + Math.max(0, column - 1));
    const end = endColumn === undefined
        ? null
        : offsetAt(lineBounds(value, endLine ?? line, starts), endColumn);
    if (end !== null && end > start)
        return { start, end };
    return spanAt(value, start, bounds.start);
}
/**
 * Diagnostics whose lines are numbered from `firstLineNumber`, as the gutter numbers them, counted
 * again from 1 at the text's first line. The same list when the text starts at line 1.
 */
export function toTextLines(diagnostics, firstLineNumber) {
    const shift = firstLineNumber - 1;
    if (shift === 0)
        return diagnostics;
    return diagnostics.map((diagnostic) => ({
        ...diagnostic,
        line: diagnostic.line === undefined ? undefined : diagnostic.line - shift,
        endLine: diagnostic.endLine === undefined ? undefined : diagnostic.endLine - shift,
    }));
}
/** Whether each offset is code: not inside a string, key or comment token. */
function createCodeMask(tokens) {
    const skipped = [];
    let offset = 0;
    for (const { text, type } of tokens) {
        if (type && textTypes.has(type))
            skipped.push({ start: offset, end: offset + text.length });
        offset += text.length;
    }
    return (at) => {
        let low = 0;
        let high = skipped.length;
        while (low < high) {
            const middle = (low + high) >>> 1;
            if ((skipped[middle]?.end ?? 0) <= at)
                low = middle + 1;
            else
                high = middle;
        }
        return at < (skipped[low]?.start ?? Infinity);
    };
}
function scanForPartner(value, from, isCode) {
    const forward = opening.has(value[from] ?? '');
    const stack = [];
    for (let at = from + (forward ? 1 : -1); at >= 0 && at < value.length; at += forward ? 1 : -1) {
        const character = value[at] ?? '';
        if (!(character in pairs) || !isCode(at))
            continue;
        if (opening.has(character) === forward)
            stack.push(character);
        else {
            if (stack.length === 0)
                return pairs[character] === value[from] ? at : null;
            const expected = stack.pop();
            if (pairs[character] !== expected)
                return null;
        }
    }
    return null;
}
/**
 * The bracket just before the caret (or else just after it) and its partner, skipping brackets in
 * strings, keys and comments; `null` when no bracket touches the caret.
 */
export function matchBracket(value, tokens, caret) {
    const isCode = createCodeMask(tokens);
    const at = [caret - 1, caret].find((offset) => offset >= 0 && (value[offset] ?? '') in pairs && isCode(offset));
    if (at === undefined)
        return null;
    return { at, partner: scanForPartner(value, at, isCode) };
}
/** The places `query` occurs in the source, ignoring case, without overlaps. */
export function findMatches(value, query) {
    if (!query)
        return [];
    return Array.from(value.matchAll(new RegExp(escapeRegExp(query), 'giu')), (match) => ({
        start: match.index,
        end: match.index + match[0].length,
    }));
}
//# sourceMappingURL=code-ranges.js.map