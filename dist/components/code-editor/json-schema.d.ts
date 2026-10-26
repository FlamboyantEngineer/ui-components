import type { UiStrings } from '../../core/strings.js';
import type { JsonNode, JsonPathStep } from './json-tree.js';
export type JsonSchemaType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
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
/** The types a schema allows, or none for any. */
export declare function listSchemaTypes(schema: JsonSchema): readonly JsonSchemaType[];
/** The places a JSON tree breaks a schema, in document order. */
export declare function validateJsonSchema(node: JsonNode, schema: JsonSchema, strings: UiStrings): JsonSchemaIssue[];
/** The schema of the value at `path`, through `properties`, `additionalProperties` and `items`. */
export declare function findSubschema(schema: JsonSchema, path: readonly JsonPathStep[]): JsonSchema | null;
//# sourceMappingURL=json-schema.d.ts.map