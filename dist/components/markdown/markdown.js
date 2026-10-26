import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useMarkdownBlocks } from './markdown-block-cache.js';
import { listMarkdownHeadings } from './markdown-headings.js';
import { markdownHooks as hooks } from './markdown-render.js';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseMarkdown } from './parse-markdown.js';
export { parseMarkdown } from './parse-markdown.js';
/**
 * Renders Markdown as React elements: headings, paragraphs, lists and task lists, block quotes,
 * code, tables through `ProseTable`, links through `Link` and text through `TextMatch`. Raw HTML
 * shows as text. While `isStreaming`, the end of the source renders as it will once complete and
 * finished blocks are not rendered again.
 */
export function Markdown({ source, headingIdPrefix, renderNode, isStreaming = false, className, ...rest }) {
    const tree = useMemo(() => {
        if (typeof source !== 'string')
            return source;
        return parseMarkdown(isStreaming ? prepareStreamingMarkdown(source) : source);
    }, [source, isStreaming]);
    const headingKey = useMemo(() => listMarkdownHeadings(tree)
        .map((heading) => heading.id)
        .join('\n'), [tree]);
    const context = useMemo(() => ({
        renderNode,
        headingIdPrefix,
        headingIds: new Set(headingKey ? headingKey.split('\n') : []),
    }), [renderNode, headingIdPrefix, headingKey]);
    const blocks = useMarkdownBlocks(tree.children, context, isStreaming);
    return (_jsx("div", { ...rest, ...hooks.root({ className, data: { streaming: isStreaming } }), children: blocks }));
}
//# sourceMappingURL=markdown.js.map