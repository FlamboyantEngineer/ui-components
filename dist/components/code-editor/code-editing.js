// Text edits a code editor makes for its keys: indentation, line breaks and bracket pairs. Each
// function reads the text and the selection and returns the edit to apply, or `null` for none.
const openers = { '(': ')', '[': ']', '{': '}' };
const quotes = new Set(['"', "'", '`']);
const closers = new Set([')', ']', '}']);
/** Characters before which an opening bracket or quote gets its partner. */
const PAIR_FOLLOWER = /^(?:$|[\s)\]},;:])/;
const WORD_CHARACTER = /[\w$]/;
function lineStartAt(value, offset) {
    return value.lastIndexOf('\n', offset - 1) + 1;
}
function lineEndAt(value, offset) {
    const end = value.indexOf('\n', offset);
    return end === -1 ? value.length : end;
}
function leadingSpace(line) {
    return /^[ \t]*/.exec(line)?.[0] ?? '';
}
/** The lines a selection touches: a selection ending at a line start leaves that line out. */
function selectedLines(value, { start, end }) {
    const last = end > start && value[end - 1] === '\n' ? end - 1 : end;
    const from = lineStartAt(value, start);
    const to = lineEndAt(value, last);
    return { from, to, lines: value.slice(from, to).split('\n') };
}
/** How many leading characters of `line` one outdent removes: a tab, or up to `size` spaces. */
function outdentWidth(line, size) {
    if (line.startsWith('\t'))
        return 1;
    return Math.min(size, /^ */.exec(line)?.[0].length ?? 0);
}
function shiftLines(value, selection, size) {
    const { from, to, lines } = selectedLines(value, selection);
    const widths = lines.map((line) => outdentWidth(line, size));
    if (widths.every((width) => width === 0))
        return null;
    const text = lines.map((line, index) => line.slice(widths[index])).join('\n');
    const first = Math.min(widths[0] ?? 0, selection.start - from);
    return {
        start: from,
        end: to,
        text,
        selection: { start: selection.start - first, end: selection.end - (to - from - text.length) },
    };
}
/**
 * Tab: a caret takes spaces up to the next indentation stop; a selection indents each non-empty
 * line it touches by one level.
 */
export function indentSelection(value, selection, size) {
    if (selection.start === selection.end) {
        const column = selection.start - lineStartAt(value, selection.start);
        const text = ' '.repeat(size - (column % size));
        const caret = selection.start + text.length;
        return { ...selection, text, selection: { start: caret, end: caret } };
    }
    const { from, to, lines } = selectedLines(value, selection);
    const unit = ' '.repeat(size);
    const text = lines.map((line) => (line ? unit + line : line)).join('\n');
    return {
        start: from,
        end: to,
        text,
        selection: {
            start: selection.start === from || !lines[0] ? selection.start : selection.start + size,
            end: selection.end + text.length - (to - from),
        },
    };
}
/** Shift+Tab: removes one level of indentation from each line the selection touches. */
export function outdentSelection(value, selection, size) {
    return shiftLines(value, selection, size);
}
/**
 * Enter: the new line keeps the indentation of the current one, one level more after an opening
 * bracket, and a closing bracket right after the caret moves to a line of its own.
 */
export function breakLine(value, selection, size) {
    const lineStart = lineStartAt(value, selection.start);
    const indentation = leadingSpace(value.slice(lineStart, selection.start));
    const before = value.slice(lineStart, selection.start).trimEnd().at(-1) ?? '';
    const after = value.slice(selection.end, lineEndAt(value, selection.end)).trimStart();
    const opens = before in openers;
    const inner = opens ? indentation + ' '.repeat(size) : indentation;
    const closes = opens && after.startsWith(openers[before] ?? '');
    const text = `\n${inner}${closes ? `\n${indentation}` : ''}`;
    const caret = selection.start + 1 + inner.length;
    return { ...selection, text, selection: { start: caret, end: caret } };
}
/** Whether typing `character` inserts its partner: a bracket or quote before space or a closer. */
function canPair(value, selection, character) {
    if (!PAIR_FOLLOWER.test(value.slice(selection.end)))
        return false;
    if (!quotes.has(character))
        return true;
    return !WORD_CHARACTER.test(value[selection.start - 1] ?? '');
}
/**
 * An opening bracket or quote typed over a selection wraps it; typed at a caret before space or a
 * closer, it inserts its partner too and leaves the caret between them.
 */
export function insertPair(value, selection, character) {
    const partner = openers[character] ?? (quotes.has(character) ? character : undefined);
    if (partner === undefined)
        return null;
    const selected = value.slice(selection.start, selection.end);
    if (!selected && !canPair(value, selection, character))
        return null;
    const start = selection.start + 1;
    return {
        ...selection,
        text: `${character}${selected}${partner}`,
        selection: { start, end: start + selected.length },
    };
}
/** Typing the closer that already follows the caret steps over it. */
export function skipCloser(value, selection, character) {
    const isCloser = closers.has(character) || quotes.has(character);
    if (!isCloser || selection.start !== selection.end || value[selection.end] !== character) {
        return null;
    }
    const caret = selection.end + 1;
    return { start: caret, end: caret, text: '', selection: { start: caret, end: caret } };
}
/** Backspace between an empty bracket or quote pair deletes both. */
export function deletePair(value, selection) {
    if (selection.start !== selection.end || selection.start === 0)
        return null;
    const before = value[selection.start - 1] ?? '';
    const partner = openers[before] ?? (quotes.has(before) ? before : undefined);
    if (partner === undefined || value[selection.start] !== partner)
        return null;
    const caret = selection.start - 1;
    return {
        start: caret,
        end: selection.start + 1,
        text: '',
        selection: { start: caret, end: caret },
    };
}
/** The leading spaces and tabs of the line holding `offset`. */
export function indentationAt(value, offset) {
    return leadingSpace(value.slice(lineStartAt(value, offset)));
}
//# sourceMappingURL=code-editing.js.map