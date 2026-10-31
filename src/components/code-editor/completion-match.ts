// Code completion text: the word before the caret, and snippets with their fields.

import { requireDefined } from '../../utils/require-defined.js';
import type { CodeRange } from './code-ranges.js';

/** A snippet's text with its fields' defaults, and where each field sits in it. */
interface ParsedSnippet {
  text: string;
  fields: CodeRange[];
}

const wordBeforeCaret = /[A-Za-z_$][\w$.]*$/;

const quotedCharacters = new Set(['\\', '$', '}']);

/** The identifier-like word that ends at `caret`, or `''`. */
export function findCompletionQuery(value: string, caret: number): string {
  return wordBeforeCaret.exec(value.slice(0, caret))?.[0] ?? '';
}

/** Reads `${…}` fields; backslashes quote a dollar, closing brace or backslash. */
export function parseSnippet(snippet: string): ParsedSnippet {
  const fields: CodeRange[] = [];
  let text = '';
  let field: { start: number; source: number } | null = null;
  for (let index = 0; index < snippet.length; index += 1) {
    const character = requireDefined(snippet[index]);
    if (character === '\\' && quotedCharacters.has(snippet[index + 1] ?? '')) {
      text += snippet[++index];
      continue;
    }
    if (!field && character === '$' && snippet[index + 1] === '{') {
      field = { start: text.length, source: index };
      index += 1;
      continue;
    }
    if (field && character === '}') {
      fields.push({ start: field.start, end: text.length });
      field = null;
      continue;
    }
    text += character;
  }
  if (field) text = text.slice(0, field.start) + snippet.slice(field.source);
  return { text, fields };
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
