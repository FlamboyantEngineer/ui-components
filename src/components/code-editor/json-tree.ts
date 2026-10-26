// JSON text read as a tree with source offsets, and the place a caret is at in text that may not
// parse yet: the path of the value it is in and whether it is at a key or a value.

import { requireDefined } from '../../utils/require-defined.js';
import { placeJsonTokens, type PlacedJsonToken } from './json-text.js';

/** A JSON value and where its text is. */
export type JsonNode =
  | { kind: 'object'; start: number; end: number; properties: JsonPropertyNode[] }
  | { kind: 'array'; start: number; end: number; items: JsonNode[] }
  | { kind: 'scalar'; start: number; end: number; value: string | number | boolean | null };

/** An object member: its key, the key's text range and its value. */
interface JsonPropertyNode {
  key: string;
  start: number;
  end: number;
  value: JsonNode;
}

/** A step from a value to one inside it: a key or an index. */
export type JsonPathStep = string | number;

/** Where a caret is in JSON text. */
export interface JsonCaretContext {
  /** The value the caret's key or value belongs to, from the root. */
  path: JsonPathStep[];
  /** At a key of an object, or at a value. */
  position: 'key' | 'value';
  /** The token the caret is in, if any. */
  token: PlacedJsonToken | null;
  /** The keys of the object the caret is in. */
  keys: string[];
}

interface Frame {
  kind: 'object' | 'array';
  start: number;
  /** The key or index the next value goes under. */
  step: JsonPathStep | null;
  expects: 'key' | 'colon' | 'value' | 'comma';
}

const SCALARS = new Set(['string', 'number', 'literal']);

type JsonContainer = Extract<JsonNode, { kind: 'object' | 'array' }>;

interface ReadFrame {
  node: JsonContainer;
  key?: PlacedJsonToken;
}

function appendNode(node: JsonNode, frame: ReadFrame | undefined) {
  if (!frame) return;
  if (frame.node.kind === 'array') frame.node.items.push(node);
  else {
    const key = requireDefined(frame.key);
    frame.node.properties.push({
      key: JSON.parse(key.text) as string,
      start: key.offset,
      end: key.offset + key.text.length,
      value: node,
    });
    delete frame.key;
  }
}

/** Builds a tree from tokens already checked by the native parser. */
function readTree(tokens: readonly PlacedJsonToken[]): JsonNode | null {
  const stack: ReadFrame[] = [];
  let root: JsonNode | null = null;
  for (const token of tokens) {
    const frame = stack.at(-1);
    if (token.text === ':' || token.text === ',') continue;
    if (token.text === '}' || token.text === ']') {
      requireDefined(frame).node.end = token.offset + 1;
      stack.pop();
      continue;
    }
    if (frame?.node.kind === 'object' && !frame.key) {
      frame.key = token;
      continue;
    }
    const node: JsonNode =
      token.text === '{'
        ? { kind: 'object', start: token.offset, end: 0, properties: [] }
        : token.text === '['
          ? { kind: 'array', start: token.offset, end: 0, items: [] }
          : {
              kind: 'scalar',
              start: token.offset,
              end: token.offset + token.text.length,
              value: JSON.parse(token.text) as string,
            };
    root ??= node;
    appendNode(node, frame);
    if (node.kind !== 'scalar') stack.push({ node });
  }
  return root;
}

/** The tree of JSON text, or `null` when it is blank or does not parse. */
export function parseJsonTree(source: string): JsonNode | null {
  if (source.trim() === '') return null;
  try {
    JSON.parse(source);
  } catch {
    return null;
  }
  return readTree(placeJsonTokens(source));
}

/** A key's text without its quotes, also while it is still being typed. */
function unquote(text: string): string {
  try {
    return JSON.parse(text) as string;
  } catch {
    return text.slice(1).replace(/"$/, '');
  }
}

function open(stack: Frame[], token: PlacedJsonToken): false {
  const isObject = token.text === '{';
  stack.push({
    kind: isObject ? 'object' : 'array',
    start: token.offset,
    step: isObject ? null : 0,
    expects: isObject ? 'key' : 'value',
  });
  return false;
}

const OPENERS = new Set(['{', '[']);

const CLOSERS = new Set(['}', ']']);

/** Moves a container past a token inside it: a key, a colon, a comma or a value. */
function step(frame: Frame, { text, type }: PlacedJsonToken) {
  if (frame.expects === 'key' && (type === 'key' || type === 'string')) {
    frame.step = unquote(text);
    frame.expects = 'colon';
  } else if (text === ':') frame.expects = 'value';
  else if (text === ',') {
    frame.expects = frame.kind === 'object' ? 'key' : 'value';
    if (frame.kind === 'array') frame.step = Number(frame.step) + 1;
  } else if (SCALARS.has(type) || CLOSERS.has(text)) frame.expects = 'comma';
}

/** Moves the reader past one token; returns whether a whole root value has been read. */
function advance(stack: Frame[], token: PlacedJsonToken): boolean {
  const { text, type } = token;
  if (OPENERS.has(text)) return open(stack, token);
  if (CLOSERS.has(text)) stack.pop();
  const frame = stack.at(-1);
  if (!frame) return CLOSERS.has(text) || SCALARS.has(type);
  step(frame, token);
  return false;
}

/** The keys directly inside the object whose `{` is at `start`. */
function collectKeys(tokens: readonly PlacedJsonToken[], start: number): string[] {
  const keys: string[] = [];
  let depth = 0;
  for (const token of tokens) {
    if (token.offset <= start) continue;
    if (OPENERS.has(token.text)) depth += 1;
    else if (CLOSERS.has(token.text)) depth -= 1;
    else if (depth === 0 && token.type === 'key') keys.push(unquote(token.text));
    if (depth < 0) break;
  }
  return keys;
}

/** The key, string, number or literal token the caret is in or right after. */
function findTokenAt(tokens: readonly PlacedJsonToken[], offset: number) {
  return tokens.find(
    ({ offset: start, text, type }) =>
      (SCALARS.has(type) || type === 'key') && start < offset && offset <= start + text.length,
  );
}

/**
 * Where the caret at `offset` is: the path of the value its key or value belongs to, whether it
 * is at a key or a value, the token it is in and the keys of its object. Text that does not parse
 * yet is read as far as it goes; `null` after a complete root value.
 */
export function findJsonContext(source: string, offset: number): JsonCaretContext | null {
  const tokens = placeJsonTokens(source);
  const token = findTokenAt(tokens, offset) ?? null;
  const stack: Frame[] = [];
  let isDone = false;
  for (const entry of tokens) {
    if (entry.offset >= offset || entry === token) break;
    isDone = advance(stack, entry);
  }
  const frame = stack.at(-1);
  if (!frame) return isDone ? null : { path: [], position: 'value', token, keys: [] };
  const steps = stack.map(({ step }) => step ?? '');
  const position = frame.kind === 'object' && frame.expects === 'key' ? 'key' : 'value';
  return {
    path: position === 'key' ? steps.slice(0, -1) : steps,
    position,
    token,
    keys: frame.kind === 'object' ? collectKeys(tokens, frame.start) : [],
  };
}
