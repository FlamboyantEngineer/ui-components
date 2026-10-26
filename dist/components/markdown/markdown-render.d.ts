import { type ReactNode } from 'react';
import type { MarkdownBlock, MarkdownNode } from './markdown-nodes.js';
export interface RenderContext {
    /** The caller's `renderNode`. */
    renderNode: ((node: MarkdownNode, children: ReactNode) => ReactNode) | undefined;
    headingIdPrefix: string | undefined;
    headingIds: ReadonlySet<string>;
}
export declare const markdownHooks: import("../../core/hooks.js").ComponentHooks<"code" | "image" | "code-block" | "task">;
/** The element of a document's top-level block, keyed by its position. */
export declare function renderMarkdownBlock(block: MarkdownBlock, index: number, context: RenderContext): ReactNode;
//# sourceMappingURL=markdown-render.d.ts.map