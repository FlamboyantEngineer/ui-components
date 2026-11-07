// The extension system behind every rich-text editor: each feature contributes its node and mark
// types, engine plugins and views, and a kit assembles them in one documented order. It reads no
// DOM, so a server builds the same schema as the browser.

import { type MarkSpec, type NodeSpec, Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';

/** A node type an extension contributes, placed by its `order` among every extension's types. */
export interface RichTextExtensionNode {
  name: string;
  spec: NodeSpec;
  /**
   * Where the type sits in the schema: lower first, ties in registration order. The first node is
   * the document's top node, and parsers try node types in this order.
   */
  order: number;
}

/** A mark type an extension contributes, placed by its `order`; marks nest in this order. */
export interface RichTextExtensionMark {
  name: string;
  spec: MarkSpec;
  order: number;
}

/** Engine plugins an extension contributes, built for each editor from its context. */
export interface RichTextPluginContribution<C = unknown> {
  /** Names the contribution in errors and in `RichTextKit.pluginOrder`. */
  name: string;
  /** Where the plugins run: lower first, ties in registration order. */
  priority: number;
  /** Builds the plugins of one editor, for the kit's schema. */
  build: (context: C, schema: Schema) => readonly Plugin[];
  /** Leaves the contribution out for a context, such as a read-only editor. */
  when?: ((context: C) => boolean) | undefined;
}

/**
 * One feature of an editor: node and mark types, plugins and views, by name. Several editors share
 * an extension; a host adds its own beside the built-in ones.
 */
export interface RichTextExtension<C = unknown> {
  /** Unique within a kit. */
  name: string;
  /** Extensions this one needs in the same kit. */
  requires?: readonly string[] | undefined;
  nodes?: readonly RichTextExtensionNode[] | undefined;
  marks?: readonly RichTextExtensionMark[] | undefined;
  plugins?: readonly RichTextPluginContribution<C>[] | undefined;
  /** Views by node type name, in whatever form the editor's renderer takes (React components). */
  nodeViews?: Readonly<Record<string, unknown>> | undefined;
  /** Views by mark type name. */
  markViews?: Readonly<Record<string, unknown>> | undefined;
}

/** The assembled extensions: one schema, and the plugins and views of each editor built on it. */
export interface RichTextKit<C = unknown> {
  readonly extensions: readonly RichTextExtension<C>[];
  readonly schema: Schema;
  /** The plugin contribution names, in the order `buildPlugins` runs them. */
  readonly pluginOrder: readonly string[];
  /** The plugins for one editor, ordered by priority. */
  buildPlugins(context: C): Plugin[];
  readonly nodeViews: Readonly<Record<string, unknown>>;
  readonly markViews: Readonly<Record<string, unknown>>;
}

interface Placed<T> {
  item: T;
  owner: string;
  index: number;
}

/** Items by their sort key, ties in registration order. */
function placeInOrder<T>(placed: Placed<T>[], key: (item: T) => number): Placed<T>[] {
  return [...placed].sort((a, b) => key(a.item) - key(b.item) || a.index - b.index);
}

/** Every item of every extension, with the extension that owns it. */
function collect<T, C>(
  extensions: readonly RichTextExtension<C>[],
  select: (extension: RichTextExtension<C>) => readonly T[] | undefined,
): Placed<T>[] {
  return extensions
    .flatMap((extension) =>
      (select(extension) ?? []).map((item) => ({ item, owner: extension.name })),
    )
    .map((entry, index) => ({ ...entry, index }));
}

/** Throws when two entries share a name, naming both owners. */
function assertUniqueNames<T extends { name: string }>(placed: Placed<T>[], kind: string) {
  const owners = new Map<string, string>();
  for (const { item, owner } of placed) {
    const earlier = owners.get(item.name);
    if (earlier !== undefined) {
      throw new Error(
        `The ${kind} "${item.name}" is contributed by both "${earlier}" and "${owner}".`,
      );
    }
    owners.set(item.name, owner);
  }
}

function assertExtensions<C>(extensions: readonly RichTextExtension<C>[]) {
  const names = new Set<string>();
  for (const { name } of extensions) {
    if (names.has(name)) throw new Error(`The extension "${name}" is registered twice.`);
    names.add(name);
  }
  for (const { name, requires } of extensions) {
    const missing = (requires ?? []).filter((required) => !names.has(required));
    if (missing.length > 0) {
      throw new Error(
        `The extension "${name}" requires ${missing.map((m) => `"${m}"`).join(', ')}.`,
      );
    }
  }
}

/** Views by type name from every extension; a type's view comes from one extension only. */
function collectViews<C>(
  extensions: readonly RichTextExtension<C>[],
  select: (extension: RichTextExtension<C>) => Readonly<Record<string, unknown>> | undefined,
  kind: string,
): Readonly<Record<string, unknown>> {
  const entries = collect(extensions, (extension) => Object.entries(select(extension) ?? {}));
  assertUniqueNames(
    entries.map(({ item: [name], ...rest }) => ({ ...rest, item: { name } })),
    kind,
  );
  return Object.fromEntries(entries.map(({ item }) => item));
}

function buildSchema<C>(extensions: readonly RichTextExtension<C>[]): Schema {
  const nodes = placeInOrder(
    collect(extensions, (extension) => extension.nodes),
    (n) => n.order,
  );
  const marks = placeInOrder(
    collect(extensions, (extension) => extension.marks),
    (m) => m.order,
  );
  assertUniqueNames(nodes, 'node type');
  assertUniqueNames(marks, 'mark type');
  return new Schema({
    nodes: Object.fromEntries(nodes.map(({ item }) => [item.name, item.spec])),
    marks: Object.fromEntries(marks.map(({ item }) => [item.name, item.spec])),
  });
}

/**
 * Assembles extensions into a kit: checks that names are unique and requirements present, builds
 * the schema from every node and mark type by `order`, and orders plugin contributions by
 * `priority`. The order of the extensions themselves only breaks ties. Create a kit once and share
 * it between editors.
 */
export function createRichTextKit<C = unknown>(
  extensions: readonly RichTextExtension<C>[],
): RichTextKit<C> {
  assertExtensions(extensions);
  const schema = buildSchema(extensions);
  const contributions = placeInOrder(
    collect(extensions, (extension) => extension.plugins),
    (contribution) => contribution.priority,
  );
  assertUniqueNames(contributions, 'plugin contribution');
  return {
    extensions,
    schema,
    pluginOrder: contributions.map(({ item }) => item.name),
    buildPlugins: (context) =>
      contributions
        .filter(({ item }) => item.when?.(context) ?? true)
        .flatMap(({ item }) => item.build(context, schema)),
    nodeViews: collectViews(extensions, (extension) => extension.nodeViews, 'node view'),
    markViews: collectViews(extensions, (extension) => extension.markViews, 'mark view'),
  };
}
