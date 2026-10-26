/**
 * Prepares a streaming source for `parseMarkdown`. Inside an open fence, the code shows as code and
 * a last line that may close the fence waits. Elsewhere a last line that cannot be read yet waits,
 * as does a table row without its divider, and the last paragraph's open inline syntax is closed.
 */
export declare function prepareStreamingMarkdown(source: string): string;
//# sourceMappingURL=markdown-streaming.d.ts.map