// The ProseMirror schema behind each library schema, kept out of the public declarations.
const engineSchemas = new WeakMap();
/** Records the engine schema a library schema was built from; returns the library schema. */
export function registerEngineSchema(schema, engine) {
    engineSchemas.set(schema, engine);
    return schema;
}
/** The ProseMirror schema behind a library schema. */
export function getEngineSchema(schema) {
    const engine = engineSchemas.get(schema);
    if (!engine)
        throw new Error('Create rich-text schemas with createRichTextSchema.');
    return engine;
}
//# sourceMappingURL=engine-schema.js.map