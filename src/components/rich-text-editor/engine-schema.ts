// The extension kit and ProseMirror schema behind each library schema.

import type { Schema } from 'prosemirror-model';
import type { RichTextKit } from './rich-text-extension.js';
import type { RichTextSchema } from './rich-text-schema.js';

const kits = new WeakMap<RichTextSchema, RichTextKit>();
const kitsByEngine = new WeakMap<Schema, RichTextKit>();

/** Records the kit a library schema was built from; returns the library schema. */
export function registerEngineKit(schema: RichTextSchema, kit: RichTextKit): RichTextSchema {
  kits.set(schema, kit);
  kitsByEngine.set(kit.schema, kit);
  return schema;
}

/** The extension kit behind a library schema. */
export function getRichTextKit(schema: RichTextSchema): RichTextKit {
  const kit = kits.get(schema);
  if (!kit) throw new Error('Create rich-text schemas with createRichTextSchema.');
  return kit;
}

/** The ProseMirror schema behind a library schema. */
export function getEngineSchema(schema: RichTextSchema): Schema {
  return getRichTextKit(schema).schema;
}

/** The kit an engine schema was assembled by, when a library schema built it. */
export function findEngineKit(engine: Schema): RichTextKit | undefined {
  return kitsByEngine.get(engine);
}
