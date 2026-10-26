import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { revealRange } from './code-geometry.js';
import { useCodeHover } from './code-hover.js';
import { findDiagnosticRange, matchBracket } from './code-ranges.js';
import { findLineStarts } from '../../utils/find-line-starts.js';
import { splitSegments } from './code-segments.js';
import { useCodeCompletion } from './use-code-completion.js';
import { useCodeEdits } from './use-code-edits.js';
import { useCodeKeys } from './use-code-keys.js';
import { useCodeSearch } from './use-code-search.js';
import { useCodeSnippet } from './use-code-snippet.js';
/** Moves the text area's selection to the next or previous diagnostic after the caret. */
function findProblem(marked, caret, delta) {
    const sorted = [...marked].sort((a, b) => a.range.start - b.range.start);
    if (delta === 1)
        return sorted.find(({ range }) => range.start > caret) ?? sorted[0];
    return sorted.findLast(({ range }) => range.start < caret) ?? sorted.at(-1);
}
/** What the highlighted copy marks: problems, search matches, the caret's brackets and the list's caret. */
function toDecorations({ marked, search, bracket, completion, }) {
    const brackets = bracket ? [bracket.at, bracket.partner] : [];
    return {
        marks: marked.map(({ diagnostic, range }) => ({
            ...range,
            severity: diagnostic.severity ?? 'error',
        })),
        matches: search.matches.map((range, index) => ({
            ...range,
            isCurrent: index === search.current,
        })),
        brackets: brackets.flatMap((at) => at === null ? [] : [{ start: at, end: at + 1, isUnmatched: bracket?.partner === null }]),
        caret: completion.isOpen ? completion.caret : null,
    };
}
/** Moves the highlighted layer and the gutter to the input's scroll offset. */
export function alignLayers({ input, highlight, gutter }) {
    const source = input.current;
    if (!source)
        return;
    if (highlight.current) {
        highlight.current.scrollTop = source.scrollTop;
        highlight.current.scrollLeft = source.scrollLeft;
    }
    if (gutter.current)
        gutter.current.scrollTop = source.scrollTop;
}
function useLayers() {
    const input = useRef(null);
    const highlight = useRef(null);
    const gutter = useRef(null);
    return useMemo(() => ({ input, highlight, gutter }), []);
}
function useDecoratedText(options, caret) {
    const { value, tokenize, diagnostics } = options;
    const tokens = useMemo(() => (tokenize ? tokenize(value) : [{ text: value }]), [tokenize, value]);
    const marked = useMemo(() => {
        if (diagnostics.length === 0)
            return [];
        const starts = findLineStarts(value);
        return diagnostics.flatMap((diagnostic) => {
            const range = findDiagnosticRange(value, diagnostic, starts);
            return range ? [{ diagnostic, range }] : [];
        });
    }, [diagnostics, value]);
    const bracket = useMemo(() => (caret === null ? null : matchBracket(value, tokens, caret)), [value, tokens, caret]);
    return { tokens, marked, bracket };
}
/**
 * The state of a code editor: its layers, the decorated source (diagnostics, brackets, search
 * matches and the completion caret), completion, search, the hover tip and the editing keys.
 */
export function useCodeEditor(options) {
    const { value, onChange, isLocked } = options;
    const layers = useLayers();
    const applyEdit = useCodeEdits({ inputRef: layers.input, value, onChange });
    const snippet = useCodeSnippet(layers.input);
    const completion = useCodeCompletion({
        completions: options.completions,
        inputRef: layers.input,
        isLocked,
        applyEdit,
        snippet,
    });
    const search = useCodeSearch({ value, inputRef: layers.input, applyEdit });
    const [caret, setCaret] = useState(null);
    const [announcement, setAnnouncement] = useState('');
    const { tokens, marked, bracket } = useDecoratedText(options, caret);
    const segments = splitSegments(tokens, toDecorations({ marked, search, bracket, completion }));
    const hover = useCodeHover({
        inputRef: layers.input,
        highlightRef: layers.highlight,
        marked,
        renderHover: options.renderHover,
        segments,
    });
    const currentMatch = search.matches[search.current];
    useLayoutEffect(() => {
        const input = layers.input.current;
        const highlight = layers.highlight.current;
        if (!currentMatch || !input || !highlight)
            return;
        revealRange(input, highlight, currentMatch);
        alignLayers(layers);
    }, [layers, currentMatch]);
    const goToProblem = (delta) => {
        const input = layers.input.current;
        const highlight = layers.highlight.current;
        const problem = input ? findProblem(marked, input.selectionStart, delta) : undefined;
        if (!input || !highlight || !problem)
            return false;
        input.setSelectionRange(problem.range.start, problem.range.end);
        revealRange(input, highlight, problem.range);
        alignLayers(layers);
        hover.showAt(problem.range);
        setAnnouncement(problem.diagnostic.message);
        return true;
    };
    const handleKeyDown = useCodeKeys({
        inputRef: layers.input,
        applyEdit,
        indent: options.indent ?? 2,
        indentWithTab: Boolean(options.indentWithTab),
        autoCloseBrackets: Boolean(options.autoCloseBrackets),
        multiline: options.multiline,
        isLocked,
        onFind: options.allowsSearch ? search.open : undefined,
        onProblem: goToProblem,
    });
    return {
        layers,
        segments,
        completion,
        search,
        hover,
        snippet,
        announcement,
        setCaret,
        handleKeyDown,
    };
}
//# sourceMappingURL=use-code-editor.js.map