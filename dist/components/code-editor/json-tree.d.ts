import { type PlacedJsonToken } from './json-text.js';
/** A JSON value and where its text is. */
export type JsonNode = {
    kind: 'object';
    start: number;
    end: number;
    properties: JsonPropertyNode[];
} | {
    kind: 'array';
    start: number;
    end: number;
    items: JsonNode[];
} | {
    kind: 'scalar';
    start: number;
    end: number;
    value: string | number | boolean | null;
};
/** An object member: its key, the key's text range and its value. */
export interface JsonPropertyNode {
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
/** The tree of JSON text, or `null` when it is blank or does not parse. */
export declare function parseJsonTree(source: string): JsonNode | null;
/**
 * Where the caret at `offset` is: the path of the value its key or value belongs to, whether it
 * is at a key or a value, the token it is in and the keys of its object. Text that does not parse
 * yet is read as far as it goes; `null` after a complete root value.
 */
export declare function findJsonContext(source: string, offset: number): JsonCaretContext | null;
//# sourceMappingURL=json-tree.d.ts.map