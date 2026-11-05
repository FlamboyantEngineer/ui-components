import { type MarkSpec, type NodeSpec, type ParseRule, Schema } from 'prosemirror-model';
import { defaultMarks, defaultNodes } from './default-schema.js';
import { registerEngineSchema } from './engine-schema.js';
import type { RichTextAttributes, RichTextAttributeValue } from './rich-text-document.js';

/** The element attributes of a rendered node or mark; `null` and `undefined` leave one out. */
export interface RichTextDomAttributes {
  readonly [name: string]: string | null | undefined;
}

/**
 * How a node or mark renders, as ProseMirror writes it: a tag name, optional attributes, then
 * children, where `0` is the hole the content goes in, as in `['blockquote', { class: 'note' }, 0]`.
 */
export type RichTextDomOutput = readonly [
  string,
  ...(RichTextDomAttributes | RichTextDomOutput | 0)[],
];

/** A node or mark as its renderer sees it. */
export interface RichTextElementData {
  type: string;
  attrs: RichTextAttributes;
}

/** Which elements of pasted or parsed HTML become a node or mark. */
export interface RichTextParseRule {
  /** A CSS selector, such as `aside.note`. */
  tag: string;
  /** Reads the attributes from the element; `false` skips it. */
  getAttrs?: ((element: HTMLElement) => RichTextAttributes | false | null) | undefined;
  /** Rules with a higher priority are tried first. Defaults to 50. */
  priority?: number | undefined;
}

/** An attribute a node or mark holds, with the value it takes when none is given. */
export interface RichTextAttributeSpec {
  default?: RichTextAttributeValue | undefined;
}

interface RichTextTypeSpec {
  attrs?: Readonly<Record<string, RichTextAttributeSpec>> | undefined;
  parseDOM?: readonly RichTextParseRule[] | undefined;
  toDOM?: ((element: RichTextElementData) => RichTextDomOutput) | undefined;
}

/** A node type, with ProseMirror's content expressions (`'inline*'`, `'paragraph block*'`). */
export interface RichTextNodeSpec extends RichTextTypeSpec {
  /** The nodes it holds; a leaf holds none. */
  content?: string | undefined;
  /** The groups it belongs to, separated by spaces, such as `block`. */
  group?: string | undefined;
  inline?: boolean | undefined;
  /** A leaf the caret steps over as one unit. */
  atom?: boolean | undefined;
  /** The marks its content allows: names, groups, `_` for all or `''` for none. */
  marks?: string | undefined;
  /** Keeps its type when its content is replaced, as headings and quotes do. */
  defining?: boolean | undefined;
  /** Holds code: plain text, without marks applied by shortcuts. */
  code?: boolean | undefined;
}

/** A mark type. */
export interface RichTextMarkSpec extends RichTextTypeSpec {
  /** Text typed at its end takes the mark. Defaults to true. */
  inclusive?: boolean | undefined;
  /** Marks it cannot share text with: names, groups or `_` for all. */
  excludes?: string | undefined;
}

/**
 * Changes to the default schema: node and mark types added, replacing a default of the same
 * name, or removed with `null`. `doc` and `text` cannot be removed.
 */
export interface RichTextSchemaOptions {
  nodes?: Readonly<Record<string, RichTextNodeSpec | null>> | undefined;
  marks?: Readonly<Record<string, RichTextMarkSpec | null>> | undefined;
}

/** The node and mark types a document may hold. Create one with `createRichTextSchema`. */
export interface RichTextSchema {
  /** The node type names, in the order the schema tries them. */
  readonly nodes: readonly string[];
  /** The mark type names, in the order they nest. */
  readonly marks: readonly string[];
}

function toParseRules(rules: readonly RichTextParseRule[] | undefined): ParseRule[] | undefined {
  return rules?.map(({ tag, getAttrs, priority }) => ({
    tag,
    priority,
    getAttrs: getAttrs ? (element: HTMLElement) => getAttrs(element) : undefined,
  }));
}

function toEngineSpec<S extends RichTextTypeSpec>({ parseDOM, toDOM, ...rest }: S) {
  return {
    ...rest,
    parseDOM: toParseRules(parseDOM),
    toDOM: toDOM
      ? (element: { type: { name: string }; attrs: RichTextAttributes }) =>
          toDOM({ type: element.type.name, attrs: element.attrs })
      : undefined,
  };
}

/** The default specs with the caller's changes applied, keeping each default in its place. */
function mergeSpecs<S, T>(
  defaults: Record<string, S>,
  changes: Readonly<Record<string, T | null>> | undefined,
  convert: (spec: T) => S,
): Record<string, S> {
  const merged: Record<string, S> = { ...defaults };
  for (const [name, spec] of Object.entries(changes ?? {})) {
    if (spec !== null) merged[name] = convert(spec);
    else if (name !== 'doc' && name !== 'text') delete merged[name];
  }
  return merged;
}

/**
 * Creates the schema of a rich-text document: the default node types (paragraph, headings 1 to
 * 3, quote, code block, divider, bullet, numbered and task lists, hard break) and marks (link,
 * bold, italic, underline, strike, code), with the caller's changes. Create it once, outside render.
 */
export function createRichTextSchema(options: RichTextSchemaOptions = {}): RichTextSchema {
  const engine = new Schema({
    nodes: mergeSpecs(defaultNodes, options.nodes, (spec) => toEngineSpec(spec) as NodeSpec),
    marks: mergeSpecs(defaultMarks, options.marks, (spec) => toEngineSpec(spec) as MarkSpec),
  });
  const schema: RichTextSchema = {
    nodes: Object.keys(engine.nodes),
    marks: Object.keys(engine.marks),
  };
  return registerEngineSchema(schema, engine);
}

let defaultSchema: RichTextSchema | undefined;

/** The default schema, created once. */
export function getDefaultRichTextSchema(): RichTextSchema {
  defaultSchema ??= createRichTextSchema();
  return defaultSchema;
}
