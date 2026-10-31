// The problems of JSON text: where it stops parsing, or where it breaks its schema, as code editor
// diagnostics and as the field's message.

import type { UiStrings } from '../../core/strings.js';
import { findLineStarts } from './find-line-starts.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { CodeDiagnostic } from './code-editor.js';
import type { FieldIssue } from '../field/field.js';
import { validateJsonSchema, type JsonSchema } from './json-schema.js';
import { findJsonError } from './json-text.js';
import { parseJsonTree } from './json-tree.js';

/** The problems to mark in the editor, and the one the field reports. */
interface JsonCheck {
  diagnostics: CodeDiagnostic[];
  issue: FieldIssue | null;
}

const noProblems: JsonCheck = { diagnostics: [], issue: null };

/** What JSON text is checked against, and how its lines are numbered. */
interface JsonCheckOptions {
  schema: JsonSchema | undefined;
  strings: UiStrings;
  /** The number of the text's first line, as the editor's gutter numbers it. Defaults to 1. */
  firstLine?: number | undefined;
}

/** The line, counted from `firstLine`, and the column, counted from 1, of an offset. */
function placeOf(starts: readonly number[], offset: number, firstLine: number) {
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (requireDefined(starts[middle]) <= offset) low = middle;
    else high = middle;
  }
  return { line: low + firstLine, column: offset - requireDefined(starts[low]) + 1 };
}

function checkParse(source: string, strings: UiStrings, firstLine: number): JsonCheck | null {
  const error = findJsonError(source);
  if (!error) return null;
  const location = error.location && {
    line: error.location.line + firstLine - 1,
    column: error.location.column,
  };
  const message = location
    ? strings.invalidJsonAt(location.line, location.column)
    : strings.invalidJson;
  return {
    diagnostics: location ? [{ message, line: location.line, column: location.column }] : [],
    issue: { severity: 'error', message },
  };
}

/**
 * Checks JSON text: text that does not parse has one problem where parsing stops; text that
 * parses is checked against `schema`, each problem marked where it is and the first one reported
 * with its line and column. Blank text has no problems. Lines count from `firstLine`, as the
 * editor's gutter numbers them (UIC-CODE-EDITOR-2.3), so the problems read like caller diagnostics.
 */
export function checkJsonText(
  source: string,
  { schema, strings, firstLine = 1 }: JsonCheckOptions,
): JsonCheck {
  const tree = schema ? parseJsonTree(source) : null;
  const parse = tree ? null : checkParse(source, strings, firstLine);
  if (parse) return parse;
  if (!tree || !schema) return noProblems;
  const starts = findLineStarts(source);
  const diagnostics = validateJsonSchema(tree, schema, strings).map(({ message, start, end }) => {
    const from = placeOf(starts, start, firstLine);
    const to = placeOf(starts, end, firstLine);
    return { message, ...from, endLine: to.line, endColumn: to.column };
  });
  const [first] = diagnostics;
  if (!first) return noProblems;
  const message = strings.jsonProblemAt(first.line, first.column, first.message);
  return { diagnostics, issue: { severity: 'error', message } };
}

/** Reuses the current result for the field check and the editor's diagnostic layer. */
export function createJsonChecker(options: JsonCheckOptions) {
  let previous: string | undefined;
  let result = noProblems;
  return (source: string): JsonCheck => {
    if (source !== previous) {
      result = checkJsonText(source, options);
      previous = source;
    }
    return result;
  };
}
