// Completions and hover documentation for JSON text from its schema: the keys an object may still
// take, the values a schema lists, and each key's or value's description.

import type {
  Completion,
  CompletionResult,
  CompletionSource,
} from '../completion-list/completion-list.js';
import { findSubschema, listSchemaTypes, type JsonSchema } from './json-schema.js';
import { findJsonContext, type JsonCaretContext } from './json-tree.js';
import { stringifyJsonValue } from './json-value.js';

/** What a value of each type starts as when its key is inserted; `${…}` is the field to fill. */
const valueTemplates: Readonly<Record<string, string>> = {
  string: '"${}"',
  number: '${0}',
  integer: '${0}',
  boolean: '${false}',
  null: 'null',
  object: '{${}}',
  array: '[${}]',
};

function readKey(text: string): string {
  try {
    return JSON.parse(text) as string;
  } catch {
    return text.replace(/^"|"$/g, '');
  }
}

function describeTypes(schema: JsonSchema): string | undefined {
  return listSchemaTypes(schema).join(' | ') || undefined;
}

function escapeSnippet(text: string): string {
  return text.replace(/[\\$}]/g, '\\$&');
}

function templateOf(schema: JsonSchema): string {
  const values = 'const' in schema ? [schema.const] : schema.enum;
  if (values?.length) return `\${${escapeSnippet(stringifyJsonValue(values[0]))}}`;
  if (schema.default !== undefined)
    return `\${${escapeSnippet(stringifyJsonValue(schema.default))}}`;
  return valueTemplates[listSchemaTypes(schema)[0] ?? ''] ?? '${}';
}

function keyOptions(schema: JsonSchema, context: JsonCaretContext, rest: string): Completion[] {
  const typing = context.token ? readKey(context.token.text) : undefined;
  const hasColon = rest.trimStart().startsWith(':');
  return Object.entries(schema.properties ?? {})
    .filter(([name]) => name === typing || !context.keys.includes(name))
    .map(([name, property]) => ({
      label: JSON.stringify(name),
      kind: 'property',
      description: describeTypes(property),
      documentation: property.description,
      insertText: hasColon
        ? escapeSnippet(JSON.stringify(name))
        : `${escapeSnippet(JSON.stringify(name))}: ${templateOf(property)}`,
    }));
}

function valueOptions(schema: JsonSchema): Completion[] {
  const types = listSchemaTypes(schema);
  const listed = 'const' in schema ? [schema.const] : (schema.enum ?? []);
  const values = [
    ...listed,
    ...(types.includes('boolean') && listed.length === 0 ? [true, false] : []),
    ...(types.includes('null') && listed.length === 0 ? [null] : []),
    ...(schema.default !== undefined && listed.length === 0 ? [schema.default] : []),
  ];
  const unique = [...new Set(values.map((value) => stringifyJsonValue(value)))];
  return unique.map((label) => ({ label, kind: 'value', documentation: schema.description }));
}

/** Whether to offer completions: while typing a key or value, after a colon, or when asked. */
function isWanted(context: JsonCaretContext, before: string, isExplicit: boolean): boolean {
  if (isExplicit || context.token) return true;
  return context.position === 'value' && before.trimEnd().endsWith(':');
}

/**
 * A completion source for JSON text that follows `schema`: at a key, the properties the object
 * does not have yet (inserted with a starting value); at a value, the values the schema lists or
 * allows. It answers while a key or value is typed, after a colon, and on request.
 */
export function createJsonCompletion(schema: JsonSchema): CompletionSource {
  return ({ value, caret, isExplicit }): CompletionResult | [] => {
    const context = findJsonContext(value, caret);
    if (!context || !isWanted(context, value.slice(0, caret), isExplicit)) return [];
    const target = findSubschema(schema, context.path);
    if (!target) return [];
    const { token } = context;
    const from = token?.offset ?? caret;
    const to = token ? token.offset + token.text.length : caret;
    const options =
      context.position === 'key'
        ? keyOptions(target, context, value.slice(to))
        : valueOptions(target);
    return { from, to, options };
  };
}

/** The description of the key or value at `offset`, from the schema; `null` without one. */
export function describeJsonAt(schema: JsonSchema, source: string, offset: number): string | null {
  const context = findJsonContext(source, offset + 1);
  const token = context?.token;
  if (!context || !token || offset < token.offset) return null;
  const key = context.position === 'key' ? [readKey(token.text)] : [];
  return findSubschema(schema, [...context.path, ...key])?.description ?? null;
}
