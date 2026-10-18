// Code completion text: the word before the caret, and snippets with their fields.

import type { CodeRange } from './code-ranges.js';

/** A snippet's text with its fields' defaults, and where each field sits in it. */
export interface ParsedSnippet {
  text: string;
  fields: CodeRange[];
}

const WORD_BEFORE_CARET = /[A-Za-z_$][\w$.]*$/;

const FIELD = /\$\{([^}]*)\}/g;

/** The identifier-like word that ends at `caret`, or `''`. */
export function findCompletionQuery(value: string, caret: number): string {
  return WORD_BEFORE_CARET.exec(value.slice(0, caret))?.[0] ?? '';
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
