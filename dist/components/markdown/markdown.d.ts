import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { MarkdownDocument, MarkdownNode } from './markdown-nodes.js';
export type { MarkdownNode } from './markdown-nodes.js';
export { parseMarkdown } from './parse-markdown.js';
export interface MarkdownProps extends BaseProps {
    /** Markdown text, or a document `parseMarkdown` returned, to share one parse with an outline. */
    source: string | MarkdownDocument;
    /** Gives headings `id`s: this prefix and the heading's slug. Without it headings have no id. */
    headingIdPrefix?: string | undefined;
    /**
     * Replaces a node's rendering: receives the node and its rendered children (`null` for nodes
     * without children). Return `undefined` to keep the default rendering, `null` to render nothing.
     */
    renderNode?: ((node: MarkdownNode, children: ReactNode) => ReactNode) | undefined;
    /**
     * The source is still arriving: incomplete syntax at its end renders as it will once complete,
     * and finished blocks keep their elements. Keep `renderNode` stable while streaming.
     */
    isStreaming?: boolean | undefined;
}
/**
 * Renders Markdown as React elements: headings, paragraphs, lists and task lists, block quotes,
 * code, tables through `ProseTable`, links through `Link` and text through `TextMatch`. Raw HTML
 * shows as text. While `isStreaming`, the end of the source renders as it will once complete and
 * finished blocks are not rendered again.
 */
export declare function Markdown({ source, headingIdPrefix, renderNode, isStreaming, className, ...rest }: MarkdownProps): import("react").JSX.Element;
//# sourceMappingURL=markdown.d.ts.map