'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import { useMarkdownBlocks } from './markdown-block-cache.js';
import { listMarkdownHeadings } from './markdown-headings.js';
import type { MarkdownDocument, MarkdownNode } from './markdown-nodes.js';
import { markdownHooks as hooks } from './markdown-render.js';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseMarkdown } from './parse-markdown.js';
import { parseStreamingMarkdown, type StreamingMarkdownParse } from './parse-streaming-markdown.js';

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
export function Markdown({
  source,
  headingIdPrefix,
  renderNode,
  isStreaming = false,
  className,
  ...rest
}: MarkdownProps) {
  const stream = useRef<StreamingMarkdownParse | null>(null);
  const tree = useMemo(() => {
    if (typeof source !== 'string') return source;
    if (!isStreaming) return parseMarkdown(source);
    stream.current = parseStreamingMarkdown(prepareStreamingMarkdown(source), stream.current);
    return stream.current.document;
  }, [source, isStreaming]);
  // The ids by content, so the blocks keep their context while the headings stay the same.
  const headings = useStableArray(
    useMemo(() => listMarkdownHeadings(tree).map((heading) => heading.id), [tree]),
  );
  const context = useMemo(
    () => ({ renderNode, headingIdPrefix, headingIds: new Set(headings) }),
    [renderNode, headingIdPrefix, headings],
  );
  const blocks = useMarkdownBlocks(tree.children, context, isStreaming);
  return (
    <div {...rest} {...hooks.root({ className, data: { streaming: isStreaming } })}>
      {blocks}
    </div>
  );
}
