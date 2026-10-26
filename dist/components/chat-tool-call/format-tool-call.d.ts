/**
 * A readable label from a tool's name: `search_recipes` and `searchRecipes` read `Search recipes`.
 * Words split at underscores, hyphens, dots, slashes, colons, spaces and case changes; words in
 * capitals keep their case.
 */
export declare function formatToolName(name: string): string;
/**
 * The text a tool call shows for its arguments or result: JSON with two-space indentation. A
 * string that holds a JSON object or array is re-indented; other strings show as given. A value
 * JSON cannot hold (a cycle, a function) shows as `String(value)`.
 */
export declare function formatToolValue(value: unknown): string;
//# sourceMappingURL=format-tool-call.d.ts.map