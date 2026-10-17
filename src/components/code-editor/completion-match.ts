// Matching and inserting code completions: the word before the caret, fuzzy ranking and snippets.

import type { CodeRange } from './code-ranges.js';

/** A completion the editor offers. */
export interface CodeCompletion {
  /** The text shown and matched, and inserted unless `insertText` says otherwise. */
  label: string;
  /** A short explanation shown beside the label. */
  description?: string | undefined;
  /** What the completion is (`keyword`, `property`, `function`, …), published as `data-kind`. */
  kind?: string | undefined;
  /** Longer documentation shown beside the list while the completion is active. */
  documentation?: string | undefined;
  /**
   * The text inserted in place of the label. `${…}` marks a field holding its default text: the
   * first field is selected after the insertion and Tab moves to the next one.
   */
  insertText?: string | undefined;
}

/** A snippet's text with its fields' defaults, and where each field sits in it. */
export interface ParsedSnippet {
  text: string;
  fields: CodeRange[];
}

const WORD_BEFORE_CARET = /[A-Za-z_$][\w$.]*$/;

const FIELD = /\$\{([^}]*)\}/g;

const WORD_SEPARATOR = /[\s._\-/:]/;

/** The identifier-like word that ends at `caret`, or `''`. */
export function findCompletionQuery(value: string, caret: number): string {
  return WORD_BEFORE_CARET.exec(value.slice(0, caret))?.[0] ?? '';
}

function isWordStart(label: string, index: number): boolean {
  if (index === 0) return true;
  const previous = label[index - 1] ?? '';
  const character = label[index] ?? '';
  return (
    WORD_SEPARATOR.test(previous) ||
    (character !== character.toLowerCase() && previous === previous.toLowerCase())
  );
}

/** How many characters `query` skips in `label` as a subsequence starting at a word; `null` if it is not one. */
function measureGaps(label: string, query: string): number | null {
  const lower = label.toLowerCase();
  const first = [...lower].findIndex(
    (character, index) => character === query[0] && isWordStart(label, index),
  );
  if (first === -1) return null;
  let gaps = 0;
  let at = first + 1;
  for (const character of query.slice(1)) {
    const found = lower.indexOf(character, at);
    if (found === -1) return null;
    if (found > at) gaps += 1;
    at = found + 1;
  }
  return gaps;
}

/**
 * How well `label` matches `query`, ignoring case: 0 when it starts with it, 1 when a word in it
 * does, more for a scattered match whose characters start at a word; `null` for no match.
 */
export function scoreCompletion(label: string, query: string): number | null {
  const lower = label.toLowerCase();
  const needle = query.toLowerCase();
  if (lower.startsWith(needle)) return 0;
  const gaps = measureGaps(label, needle);
  return gaps === null ? null : 1 + gaps;
}

/**
 * The completions matching `query`, best first and otherwise in their order: labels that start
 * with it, then labels whose words hold its characters in order. A label equal to the query is
 * left out; an empty query keeps them all.
 */
export function matchCompletions(
  completions: readonly CodeCompletion[],
  query: string,
): CodeCompletion[] {
  if (!query) return [...completions];
  return completions
    .map((completion, index) => ({
      completion,
      index,
      score: scoreCompletion(completion.label, query),
    }))
    .filter(({ completion, score }) => score !== null && completion.label !== query)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.index - b.index)
    .map(({ completion }) => completion);
}

/** Replaces each `${…}` field with its default text and records where the fields are. */
export function parseSnippet(snippet: string): ParsedSnippet {
  const fields: CodeRange[] = [];
  let text = '';
  let last = 0;
  for (const match of snippet.matchAll(FIELD)) {
    text += snippet.slice(last, match.index);
    const placeholder = match[1] ?? '';
    fields.push({ start: text.length, end: text.length + placeholder.length });
    text += placeholder;
    last = match.index + match[0].length;
  }
  return { text: text + snippet.slice(last), fields };
}

/** Indents every line of a multiline insertion after the first like the line it goes into. */
export function indentInsertion(snippet: ParsedSnippet, indentation: string): ParsedSnippet {
  if (!indentation || !snippet.text.includes('\n')) return snippet;
  const shift = (offset: number) =>
    offset + indentation.length * (snippet.text.slice(0, offset).split('\n').length - 1);
  return {
    text: snippet.text.replaceAll('\n', `\n${indentation}`),
    fields: snippet.fields.map(({ start, end }) => ({ start: shift(start), end: shift(end) })),
  };
}
