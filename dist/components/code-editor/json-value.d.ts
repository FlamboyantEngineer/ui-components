import type { JsonNode } from './json-tree.js';
/** JSON objects compare by their own keys and values, independently of key order. */
export declare function isJsonValueEqual(node: JsonNode, value: unknown): boolean;
/** Serializes plain JSON values without consuming a call frame for each container. */
export declare function stringifyJsonValue(value: unknown, indent?: number): string;
//# sourceMappingURL=json-value.d.ts.map