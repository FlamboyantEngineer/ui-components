import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { revealRange } from './code-geometry.js';
import { useCodeHover, type CodeHoverModel, type MarkedDiagnostic } from './code-hover.js';
import type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
import { findDiagnosticRange, matchBracket, type BracketMatch } from './code-ranges.js';
import { findLineStarts } from '../../utils/find-line-starts.js';
import { splitSegments, type CodeDecorations, type CodeSegment } from './code-segments.js';
import type { Completions, CompletionsModel } from '../completion-list/completion-list.js';
import { useCodeCompletion } from './use-code-completion.js';
import { useCodeEdits } from './use-code-edits.js';
import { useCodeKeys } from './use-code-keys.js';
import { useCodeSearch, type CodeSearchModel } from './use-code-search.js';
import { useCodeSnippet, type CodeSnippetSession } from './use-code-snippet.js';

export interface CodeLayers {
  input: RefObject<HTMLTextAreaElement | null>;
  highlight: RefObject<HTMLPreElement | null>;
  gutter: RefObject<HTMLDivElement | null>;
}

export interface CodeEditorOptions {
  value: string;
  onChange: ((value: string) => void) | undefined;
  tokenize: CodeTokenizer | undefined;
  diagnostics: readonly CodeDiagnostic[];
  completions: Completions | undefined;
  renderHover: ((offset: number) => ReactNode) | undefined;
  /** Defaults to 2. */
  indent: number | undefined;
  indentWithTab: boolean | undefined;
  autoCloseBrackets: boolean | undefined;
  allowsSearch: boolean | undefined;
  /** `false` leaves Enter to the caller instead of breaking the line. */
  multiline: boolean;
  isLocked: boolean;
}

/** Everything the editor's parts draw from: layers, decorated text and the interaction models. */
export interface CodeEditorModel {
  layers: CodeLayers;
  segments: Array<CodeSegment | null>;
  completion: CompletionsModel;
  search: CodeSearchModel;
  hover: CodeHoverModel;
  snippet: CodeSnippetSession;
  /** The latest message read out after moving to a problem. */
  announcement: string;
  /** Records the caret for bracket matching; `null` while the text area has no focus. */
  setCaret(caret: number | null): void;
  /** Handles the editing keys; returns whether a key was used. */
  handleKeyDown: ReturnType<typeof useCodeKeys>;
}

/** Moves the text area's selection to the next or previous diagnostic after the caret. */
function findProblem(marked: readonly MarkedDiagnostic[], caret: number, delta: 1 | -1) {
  const sorted = [...marked].sort((a, b) => a.range.start - b.range.start);
  if (delta === 1) return sorted.find(({ range }) => range.start > caret) ?? sorted[0];
  return sorted.findLast(({ range }) => range.start < caret) ?? sorted.at(-1);
}

/** What the highlighted copy marks: problems, search matches, the caret's brackets and the list's caret. */
function toDecorations({
  marked,
  search,
  bracket,
  completion,
}: {
  marked: readonly MarkedDiagnostic[];
  search: CodeSearchModel;
  bracket: BracketMatch | null;
  completion: CompletionsModel;
}): CodeDecorations {
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
    brackets: brackets.flatMap((at) =>
      at === null ? [] : [{ start: at, end: at + 1, isUnmatched: bracket?.partner === null }],
    ),
    caret: completion.isOpen ? completion.caret : null,
  };
}

/** Moves the highlighted layer and the gutter to the input's scroll offset. */
export function alignLayers({ input, highlight, gutter }: CodeLayers) {
  const source = input.current;
  if (!source) return;
  if (highlight.current) {
    highlight.current.scrollTop = source.scrollTop;
    highlight.current.scrollLeft = source.scrollLeft;
  }
  if (gutter.current) gutter.current.scrollTop = source.scrollTop;
}

function useLayers(): CodeLayers {
  const input = useRef<HTMLTextAreaElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  return useMemo(() => ({ input, highlight, gutter }), []);
}

function useDecoratedText(options: CodeEditorOptions, caret: number | null) {
  const { value, tokenize, diagnostics } = options;
  const tokens = useMemo<readonly CodeToken[]>(
    () => (tokenize ? tokenize(value) : [{ text: value }]),
    [tokenize, value],
  );
  const marked = useMemo(() => {
    if (diagnostics.length === 0) return [];
    const starts = findLineStarts(value);
    return diagnostics.flatMap((diagnostic) => {
      const range = findDiagnosticRange(value, diagnostic, starts);
      return range ? [{ diagnostic, range }] : [];
    });
  }, [diagnostics, value]);
  const bracket = useMemo(
    () => (caret === null ? null : matchBracket(value, tokens, caret)),
    [value, tokens, caret],
  );
  return { tokens, marked, bracket };
}

/**
 * The state of a code editor: its layers, the decorated source (diagnostics, brackets, search
 * matches and the completion caret), completion, search, the hover tip and the editing keys.
 */
export function useCodeEditor(options: CodeEditorOptions): CodeEditorModel {
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
  const [caret, setCaret] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const { tokens, marked, bracket } = useDecoratedText(options, caret);
  const hover = useCodeHover({
    inputRef: layers.input,
    highlightRef: layers.highlight,
    marked,
    renderHover: options.renderHover,
  });
  const segments = splitSegments(tokens, toDecorations({ marked, search, bracket, completion }));
  const currentMatch = search.matches[search.current];
  useLayoutEffect(() => {
    const input = layers.input.current;
    const highlight = layers.highlight.current;
    if (!currentMatch || !input || !highlight) return;
    revealRange(input, highlight, currentMatch);
    alignLayers(layers);
  }, [layers, currentMatch]);
  const goToProblem = (delta: 1 | -1) => {
    const input = layers.input.current;
    const highlight = layers.highlight.current;
    const problem = input ? findProblem(marked, input.selectionStart, delta) : undefined;
    if (!input || !highlight || !problem) return false;
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
