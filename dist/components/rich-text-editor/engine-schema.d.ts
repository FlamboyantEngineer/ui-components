import type { Schema } from 'prosemirror-model';
import type { RichTextSchema } from './rich-text-schema.js';
/** Records the engine schema a library schema was built from; returns the library schema. */
export declare function registerEngineSchema(schema: RichTextSchema, engine: Schema): RichTextSchema;
/** The ProseMirror schema behind a library schema. */
export declare function getEngineSchema(schema: RichTextSchema): Schema;
//# sourceMappingURL=engine-schema.d.ts.map