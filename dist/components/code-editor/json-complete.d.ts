import type { CompletionSource } from '../completion-list/completion-list.js';
import { type JsonSchema } from './json-schema.js';
/**
 * A completion source for JSON text that follows `schema`: at a key, the properties the object
 * does not have yet (inserted with a starting value); at a value, the values the schema lists or
 * allows. It answers while a key or value is typed, after a colon, and on request.
 */
export declare function createJsonCompletion(schema: JsonSchema): CompletionSource;
/** The description of the key or value at `offset`, from the schema; `null` without one. */
export declare function describeJsonAt(schema: JsonSchema, source: string, offset: number): string | null;
//# sourceMappingURL=json-complete.d.ts.map