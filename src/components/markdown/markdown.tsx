'use client';

import { useMemo, useState } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import { useMarkdownBlocks } from './markdown-block-cache.js';
import { listMarkdownHeadings } from './markdown-headings.js';
import type { MarkdownDocument } from './markdown-nodes.js';
import type { MarkdownRenderNode } from './markdown-place.js';
import { markdownHooks as hooks } from './markdown-render.js';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseMarkdown } from './parse-markdown.js';
import { parseStreamingMarkdown, type StreamingMarkdownParse } from './parse-streaming-markdown.js';

export type { MarkdownNode } from './markdown-nodes.js';
export { parseMarkdown } from './parse-markdown.js';

export interface MarkdownProps extends RefProps<HTMLDivElement>, BaseProps {
  /** Markdown text, or a document `parseMarkdown` returned, to share one parse with an outline. */
  source: string | MarkdownDocument;
  /** Gives headings `id`s: this prefix and the heading's slug. Without it headings have no id. */
  headingIdPrefix?: string | undefined;
  /**
   * Replaces a node's rendering: receives the node, its rendered children (`null` for nodes without
   * children) and where it renders (inside a link or a task label). Return `undefined` to keep the
   * default rendering, `null` to render nothing.
   */
  renderNode?: MarkdownRenderNode | undefined;
  /**
   * The source is still arriving: incomplete syntax at its end renders as it will once complete,
   * and finished blocks keep their elements. Keep `renderNode` stable while streaming.
   */
  isStreaming?: boolean | undefined;
}

/**
 * The document to draw: the given one, the parsed source, or while streaming, the source parsed
 * from where the previous parse stopped settling.
 */
function useMarkdownDocument(
  source: MarkdownProps['source'],
  isStreaming: boolean,
): MarkdownDocument {
  const [streamed, setStreamed] = useState<{
    text: string;
    parse: StreamingMarkdownParse;
  } | null>(null);
  const parsed = useMemo(
    () => (typeof source === 'string' && !isStreaming ? parseMarkdown(source) : null),
    [source, isStreaming],
  );
  if (typeof source !== 'string') return source;
  if (parsed) return parsed;
  if (streamed?.text === source) return streamed.parse.document;
  const parse = parseStreamingMarkdown(prepareStreamingMarkdown(source), streamed?.parse ?? null);
  setStreamed({ text: source, parse });
  return parse.document;
}

/**
 * Renders Markdown as React elements: headings, paragraphs, lists and task lists, block quotes,
 * code, tables through `ProseTable`, links through `Link` and text through `TextMatch`. Raw HTML
 * shows as text. While `isStreaming`, the end of the source renders as it will once complete and
 * finished blocks are not rendered again.
 */
export function Markdown({
  ref,
  source,
  headingIdPrefix,
  renderNode,
  isStreaming = false,
  className,
  id,
  ...rest
}: MarkdownProps) {
  const tree = useMarkdownDocument(source, isStreaming);
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
    <div
      ref={ref}
      {...hooks.root({ className, props: rest, data: { streaming: isStreaming } })}
      id={id}
    >
      {blocks}
    </div>
  );
}
