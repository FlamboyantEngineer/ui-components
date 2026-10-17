// A documented subset of JSON Schema checked against a JSON tree: types, enumerations, constants,
// object properties, array items and the number, string and array limits.

import type { UiStrings } from '../../core/strings.js';
import type { JsonNode, JsonPathStep } from './json-tree.js';

export type JsonSchemaType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null';

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
export interface JsonSchemaIssue {
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

/** The plain value of a node. */
export function toJsonValue(node: JsonNode): unknown {
  if (node.kind === 'scalar') return node.value;
  if (node.kind === 'array') return node.items.map(toJsonValue);
  return Object.fromEntries(node.properties.map(({ key, value }) => [key, toJsonValue(value)]));
}

function typeOf(node: JsonNode): JsonSchemaType {
  if (node.kind !== 'scalar') return node.kind;
  if (node.value === null) return 'null';
  return typeof node.value as 'string' | 'number' | 'boolean';
}

function hasType(node: JsonNode, type: JsonSchemaType): boolean {
  const actual = typeOf(node);
  if (type === 'integer') return actual === 'number' && Number.isInteger(toJsonValue(node));
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
  const allowed = schema.enum ?? ('const' in schema ? [schema.const] : undefined);
  const value = JSON.stringify(toJsonValue(node));
  if (allowed && !allowed.some((entry) => JSON.stringify(entry) === value)) {
    report(check, strings.jsonValueMismatch(allowed.map((entry) => JSON.stringify(entry))));
    return false;
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

function checkArray(check: Check, items: readonly JsonNode[]) {
  const { schema, strings } = check;
  if (schema.minItems !== undefined && items.length < schema.minItems)
    report(check, strings.jsonTooFewItems(schema.minItems));
  if (schema.maxItems !== undefined && items.length > schema.maxItems)
    report(check, strings.jsonTooManyItems(schema.maxItems));
  const itemSchema = schema.items;
  if (itemSchema) for (const item of items) checkNode({ ...check, node: item, schema: itemSchema });
}

function checkObject(check: Check, node: Extract<JsonNode, { kind: 'object' }>) {
  const { schema, strings } = check;
  const keys = new Set(node.properties.map(({ key }) => key));
  for (const name of schema.required ?? []) {
    if (!keys.has(name))
      report(check, strings.jsonMissingProperty(name), { start: node.start, end: node.start + 1 });
  }
  for (const property of node.properties) {
    const own = schema.properties?.[property.key];
    const extra = schema.additionalProperties;
    if (own) checkNode({ ...check, node: property.value, schema: own });
    else if (extra === false) report(check, strings.jsonUnknownProperty(property.key), property);
    else if (extra && extra !== true) checkNode({ ...check, node: property.value, schema: extra });
  }
}

function checkNode(check: Check) {
  const { node } = check;
  if (!checkValue(check)) return;
  if (node.kind === 'scalar') checkScalar(check, node.value);
  else if (node.kind === 'array') checkArray(check, node.items);
  else checkObject(check, node);
}

/** The places a JSON tree breaks a schema, in document order. */
export function validateJsonSchema(
  node: JsonNode,
  schema: JsonSchema,
  strings: UiStrings,
): JsonSchemaIssue[] {
  const issues: JsonSchemaIssue[] = [];
  checkNode({ node, schema, strings, issues });
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
      typeof step === 'number' ? (current.items ?? null) : (current.properties?.[step] ?? extra);
  }
  return current;
}
