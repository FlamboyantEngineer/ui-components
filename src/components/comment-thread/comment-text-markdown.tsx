'use client';

// A comment's text read as inline Markdown, with its mentions kept as chips: each mention becomes a
// marker that Markdown reads as plain text, and text nodes turn markers back into chips
// (specs/COMMENT-THREAD.md, UIC-COMMENT-THREAD-3.3).

import { Fragment, type ReactNode } from 'react';
import { isSafeUrl } from '../../utils/safe-url.js';
import type { CommentTextSegment } from '../comment-composer/comment-mentions.js';
import { Link } from '../link/link.js';
import { parseMarkdownInlines } from '../markdown/markdown-inlines.js';
import type { MarkdownInline } from '../markdown/markdown-nodes.js';

type MentionSegment = Extract<CommentTextSegment, { kind: 'mention' }>;

/** Draws one mention's chip; `isInLink` asks for a chip without a card, inside a link. */
export type RenderMention = (mention: MentionSegment, isInLink: boolean) => ReactNode;

// A marker is a private-use opening, the mention's position and a private-use closing. The text's
// own private-use openings are replaced first, so text cannot spell a marker.
const markerStart = '';
const markerEnd = '';
const markerPattern = /(\d+)/g;
const externalUrl = /^https?:\/\//i;

/** The text with every mention replaced by its marker, and the mentions in marker order. */
function writeMarkers(segments: readonly CommentTextSegment[]) {
  const mentions: MentionSegment[] = [];
  const source = segments
    .map((segment) => {
      if (segment.kind === 'text') return segment.text.replaceAll(markerStart, '�');
      mentions.push(segment);
      return `${markerStart}${mentions.length - 1}${markerEnd}`;
    })
    .join('');
  return { source, mentions };
}

interface InlineContext {
  mentions: readonly MentionSegment[];
  renderMention: RenderMention;
  isInLink: boolean;
}

/** A text node, with its markers turned back into chips. */
function renderText(text: string, context: InlineContext): ReactNode[] {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(markerPattern)) {
    const mention = context.mentions[Number(match[1])];
    if (!mention) continue;
    if (match.index > at) parts.push(text.slice(at, match.index));
    parts.push(
      <Fragment key={match.index}>{context.renderMention(mention, context.isInLink)}</Fragment>,
    );
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/** The marker-free text of an inline node, for the code spans and images that show text alone. */
function restoreText(text: string, mentions: readonly MentionSegment[]): string {
  return text.replace(markerPattern, (marker, index: string) => {
    return mentions[Number(index)]?.text ?? marker;
  });
}

/**
 * A link, with mentions in its address and title written as their tokens: an address that the
 * restored tokens make unsafe renders its content without a link.
 */
function renderLink(node: Extract<MarkdownInline, { type: 'link' }>, context: InlineContext) {
  const content = renderInlines(node.children, { ...context, isInLink: true });
  const href = restoreText(node.href, context.mentions);
  if (!isSafeUrl(href)) return content;
  return (
    <Link
      href={href}
      isExternal={externalUrl.test(href)}
      title={node.title ? restoreText(node.title, context.mentions) : undefined}
    >
      {content}
    </Link>
  );
}

function renderInline(node: MarkdownInline, context: InlineContext): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node.text, context);
    case 'inlineCode':
      return <code>{restoreText(node.text, context.mentions)}</code>;
    case 'emphasis':
      return <em>{renderInlines(node.children, context)}</em>;
    case 'strong':
      return <strong>{renderInlines(node.children, context)}</strong>;
    case 'strikethrough':
      return <del>{renderInlines(node.children, context)}</del>;
    case 'link':
      return renderLink(node, context);
    case 'image':
      // A comment shows no pictures from its text: the image reads as its alt text.
      return restoreText(node.alt, context.mentions);
    case 'lineBreak':
      return <br />;
  }
}

function renderInlines(nodes: readonly MarkdownInline[], context: InlineContext): ReactNode[] {
  return nodes.map((node, index) => <Fragment key={index}>{renderInline(node, context)}</Fragment>);
}

/** The segments of a comment's text read as inline Markdown, with mentions drawn as chips. */
export function renderMarkdownComment(
  segments: readonly CommentTextSegment[],
  renderMention: RenderMention,
): ReactNode[] {
  const { source, mentions } = writeMarkers(segments);
  return renderInlines(parseMarkdownInlines(source, new Map()), {
    mentions,
    renderMention,
    isInLink: false,
  });
}
