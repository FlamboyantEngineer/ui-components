import { type ReactNode } from 'react';
import type { MarkdownBlock } from './markdown-nodes.js';
import { type RenderContext } from './markdown-render.js';
/**
 * A string that differs whenever the node or any node below it differs, built without recursive
 * calls so a deeply nested block cannot overflow the stack.
 */
export declare function signMarkdownNode(node: object): string;
/**
 * The elements of the document's top-level blocks. A block the previous render drew in the same
 * rendering context reuses its element, so React skips it and `renderNode` is not called for its
 * nodes again: the same block object, or while streaming, a block of the same content at the same
 * position.
 */
export declare function useMarkdownBlocks(blocks: readonly MarkdownBlock[], context: RenderContext, isStreaming: boolean): ReactNode[];
//# sourceMappingURL=markdown-block-cache.d.ts.map