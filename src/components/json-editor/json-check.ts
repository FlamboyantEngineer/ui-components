// The problems of JSON text: where it stops parsing, or where it breaks its schema, as code editor
// diagnostics and as the field's message.

import type { UiStrings } from '../../core/strings.js';
import type { CodeDiagnostic } from '../code-editor/code-editor.js';
import type { FieldIssue } from '../field/field.js';
import { validateJsonSchema, type JsonSchema } from './json-schema.js';
import { findJsonError } from './json-text.js';
import { parseJsonTree } from './json-tree.js';

/** The problems to mark in the editor, and the one the field reports. */
export interface JsonCheck {
  diagnostics: CodeDiagnostic[];
  issue: FieldIssue | null;
}

const noProblems: JsonCheck = { diagnostics: [], issue: null };

/** The line and column, counted from 1, of an offset. */
function placeOf(source: string, offset: number) {
  const lines = source.slice(0, offset).split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function checkParse(source: string, strings: UiStrings): JsonCheck | null {
  const error = findJsonError(source);
  if (!error) return null;
  const { location } = error;
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
 * with its line and column. Blank text has no problems.
 */
export function checkJsonText(
  source: string,
  schema: JsonSchema | undefined,
  strings: UiStrings,
): JsonCheck {
  const parse = checkParse(source, strings);
  if (parse) return parse;
  const tree = schema ? parseJsonTree(source) : null;
  if (!tree || !schema) return noProblems;
  const diagnostics = validateJsonSchema(tree, schema, strings).map(({ message, start, end }) => {
    const from = placeOf(source, start);
    const to = placeOf(source, end);
    return { message, ...from, endLine: to.line, endColumn: to.column };
  });
  const [first] = diagnostics;
  if (!first) return noProblems;
  const message = strings.jsonProblemAt(first.line, first.column, first.message);
  return { diagnostics, issue: { severity: 'error', message } };
}
