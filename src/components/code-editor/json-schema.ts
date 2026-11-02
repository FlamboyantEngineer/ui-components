// A documented subset of JSON Schema checked against a JSON tree: types, enumerations, constants,
// object properties, array items and the number, string and array limits.

import type { UiStrings } from '../../core/strings.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { JsonNode, JsonPathStep } from './json-tree.js';
import { isJsonValueEqual, stringifyJsonValue } from './json-value.js';

export type JsonSchemaType =
  'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';

/** The JSON Schema keywords the JSON editor understands; others are ignored. */
export interface JsonSchema {
  type?: JsonSchemaType | readonly JsonSchemaType[] | undefined;
  /** The allowed values. */
  enum?: readonly unknown[] | undefined;
  /** The one allowed value. */
  const?: unknown;
  properties?: Readonly<Record<string, JsonSchema>> | undefined;
  /** Properties an object must have. */
  required?: readonly string[] | undefined;
  /** `false` refuses properties not in `properties`; a schema checks them. */
  additionalProperties?: boolean | JsonSchema | undefined;
  /** The schema of every array item. */
  items?: JsonSchema | undefined;
  minimum?: number | undefined;
  maximum?: number | undefined;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  /** A regular expression a string must match. */
  pattern?: string | undefined;
  minItems?: number | undefined;
  maxItems?: number | undefined;
  /** Shown as documentation in completions and hover tips. */
  description?: string | undefined;
  /** Offered as a value completion. */
  default?: unknown;
}

/** A value that breaks the schema, and the text to mark. */
interface JsonSchemaIssue {
  message: string;
  start: number;
  end: number;
}

interface Check {
  node: JsonNode;
  schema: JsonSchema;
  strings: UiStrings;
  issues: JsonSchemaIssue[];
}

function typeOf(node: JsonNode): JsonSchemaType {
  if (node.kind !== 'scalar') return node.kind;
  if (node.value === null) return 'null';
  return typeof node.value as 'string' | 'number' | 'boolean';
}

function hasType(node: JsonNode, type: JsonSchemaType): boolean {
  const actual = typeOf(node);
  if (type === 'integer')
    return node.kind === 'scalar' && typeof node.value === 'number' && Number.isInteger(node.value);
  return actual === type;
}

/** The types a schema allows, or none for any. */
export function listSchemaTypes(schema: JsonSchema): readonly JsonSchemaType[] {
  if (schema.type === undefined) return [];
  return typeof schema.type === 'string' ? [schema.type] : schema.type;
}

function report(check: Check, message: string, range: { start: number; end: number } = check.node) {
  check.issues.push({ message, start: range.start, end: range.end });
}

function checkValue(check: Check): boolean {
  const { node, schema, strings } = check;
  const types = listSchemaTypes(schema);
  if (types.length > 0 && !types.some((type) => hasType(node, type))) {
    report(check, strings.jsonTypeMismatch(types));
    return false;
  }
  const constraints = [schema.enum, 'const' in schema ? [schema.const] : undefined];
  for (const allowed of constraints) {
    if (allowed && !allowed.some((entry) => isJsonValueEqual(node, entry))) {
      report(check, strings.jsonValueMismatch(allowed.map((entry) => stringifyJsonValue(entry))));
      return false;
    }
  }
  return true;
}

/** Whether a string matches a pattern; a pattern that is not a valid expression matches all. */
function matchesPattern(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern, 'u').test(value);
  } catch {
    return true;
  }
}

function checkScalar(check: Check, value: unknown) {
  const { schema, strings } = check;
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum)
      report(check, strings.rangeUnderflow(String(schema.minimum)));
    if (schema.maximum !== undefined && value > schema.maximum)
      report(check, strings.rangeOverflow(String(schema.maximum)));
  }
  if (typeof value !== 'string') return;
  const length = [...value].length;
  if (schema.minLength !== undefined && length < schema.minLength)
    report(check, strings.tooShort(schema.minLength));
  if (schema.maxLength !== undefined && length > schema.maxLength)
    report(check, strings.tooLong(schema.maxLength));
  if (schema.pattern !== undefined && !matchesPattern(schema.pattern, value)) {
    report(check, strings.patternMismatch);
  }
}

function checkArray(check: Check, items: readonly JsonNode[], pending: Check[]) {
  const { schema, strings } = check;
  if (schema.minItems !== undefined && items.length < schema.minItems)
    report(check, strings.jsonTooFewItems(schema.minItems));
  if (schema.maxItems !== undefined && items.length > schema.maxItems)
    report(check, strings.jsonTooManyItems(schema.maxItems));
  const itemSchema = schema.items;
  if (itemSchema) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      pending.push({ ...check, node: requireDefined(items[index]), schema: itemSchema });
    }
  }
}

function checkObject(check: Check, node: Extract<JsonNode, { kind: 'object' }>, pending: Check[]) {
  const { schema, strings } = check;
  const properties = new Map(node.properties.map((property) => [property.key, property]));
  for (const name of schema.required ?? []) {
    if (!properties.has(name))
      report(check, strings.jsonMissingProperty(name), { start: node.start, end: node.start + 1 });
  }
  const entries = [...properties.values()];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const property = requireDefined(entries[index]);
    const own = getPropertySchema(schema, property.key);
    const extra = schema.additionalProperties;
    if (own) pending.push({ ...check, node: property.value, schema: own });
    else if (extra === false) report(check, strings.jsonUnknownProperty(property.key), property);
    else if (extra && extra !== true)
      pending.push({ ...check, node: property.value, schema: extra });
  }
}

/** Only declared properties describe a JSON key; prototype members are ordinary extra keys. */
function getPropertySchema(schema: JsonSchema, key: string): JsonSchema | undefined {
  return schema.properties && Object.hasOwn(schema.properties, key)
    ? schema.properties[key]
    : undefined;
}

/** The places a JSON tree breaks a schema, in document order. */
export function validateJsonSchema(
  node: JsonNode,
  schema: JsonSchema,
  strings: UiStrings,
): JsonSchemaIssue[] {
  const issues: JsonSchemaIssue[] = [];
  const pending: Check[] = [{ node, schema, strings, issues }];
  while (pending.length > 0) {
    const check = requireDefined(pending.pop());
    if (!checkValue(check)) continue;
    if (check.node.kind === 'scalar') checkScalar(check, check.node.value);
    else if (check.node.kind === 'array') checkArray(check, check.node.items, pending);
    else checkObject(check, check.node, pending);
  }
  return issues.sort((a, b) => a.start - b.start);
}

/** The schema of the value at `path`, through `properties`, `additionalProperties` and `items`. */
export function findSubschema(
  schema: JsonSchema,
  path: readonly JsonPathStep[],
): JsonSchema | null {
  let current: JsonSchema | null = schema;
  for (const step of path) {
    if (!current) return null;
    const extra: JsonSchema | null =
      typeof current.additionalProperties === 'object' ? current.additionalProperties : null;
    current =
      typeof step === 'number'
        ? (current.items ?? null)
        : (getPropertySchema(current, step) ?? extra);
  }
  return current;
}
