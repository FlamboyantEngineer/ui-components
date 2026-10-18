// The ProseMirror schema behind each library schema, kept out of the public declarations.

import type { Schema } from 'prosemirror-model';
import type { RichTextSchema } from './rich-text-schema.js';

const engineSchemas = new WeakMap<RichTextSchema, Schema>();

/** Records the engine schema a library schema was built from; returns the library schema. */
export function registerEngineSchema(schema: RichTextSchema, engine: Schema): RichTextSchema {
  engineSchemas.set(schema, engine);
  return schema;
}

/** The ProseMirror schema behind a library schema. */
export function getEngineSchema(schema: RichTextSchema): Schema {
  const engine = engineSchemas.get(schema);
  if (!engine) throw new Error('Create rich-text schemas with createRichTextSchema.');
  return engine;
}
