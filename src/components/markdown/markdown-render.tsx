'use client';
import { createElement, Fragment, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { mapTreeToDepth } from '../../utils/map-tree.js';
import { maxMarkupDepth } from '../../utils/markup.js';
import { untrustedImageProps } from '../../utils/safe-url.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Link } from '../link/link.js';
import { ProseTable } from '../prose-table/prose-table.js';
import { Separator } from '../separator/separator.js';
import { TextMatch } from '../text-match/text-match.js';
import type {
  MarkdownBlock,
  MarkdownInline,
  MarkdownListItem,
  MarkdownNode,
  MarkdownTable,
} from './markdown-nodes.js';
import type { MarkdownNodePlace, MarkdownRenderNode } from './markdown-place.js';

export interface RenderContext {
  /** The caller's `renderNode`. */
  renderNode: MarkdownRenderNode | undefined;
  headingIdPrefix: string | undefined;
  headingIds: ReadonlySet<string>;
}

/**
 * A node to render, whether it sits directly in an item of a tight list, whether it sits inside a
 * link or a task item's label, and for a top-level block its position in the document, which keys
 * it.
 */
interface RenderEntry extends MarkdownNodePlace {
  node: MarkdownNode;
  isTight: boolean;
  key?: number;
}

export const markdownHooks = createHooks('markdown', ['code-block', 'code', 'task', 'image']);

const hooks = markdownHooks;

const externalUrl = /^https?:/i;

const inlineTypes: ReadonlySet<string> = new Set([
  'text',
  'inlineCode',
  'emphasis',
  'strong',
  'strikethrough',
  'link',
  'image',
  'lineBreak',
]);

/** A task item's label, its first paragraph's inlines, and its other blocks. */
function splitTask(node: MarkdownListItem) {
  const [first, ...rest] = node.children;
  return first?.type === 'paragraph'
    ? { label: first.children, blocks: rest }
    : { label: [], blocks: node.children };
}

/**
 * The entries a node renders its children from. A task item renders its label's inlines in place of
 * its first paragraph, then its other blocks, so every node renders once. A link's content and a
 * task item's label are interactive places, as is everything inside them.
 */
function listChildEntries({
  node,
  isTight,
  isInteractive,
}: RenderEntry): RenderEntry[] | undefined {
  if (!('children' in node)) return undefined;
  if (node.type === 'list') {
    return node.children.map((item) => ({ node: item, isTight: node.tight, isInteractive }));
  }
  if (node.type !== 'listItem') {
    const inside = isInteractive || node.type === 'link';
    return node.children.map((child) => ({ node: child, isTight: false, isInteractive: inside }));
  }
  if (node.checked === null) {
    return node.children.map((child) => ({ node: child, isTight, isInteractive }));
  }
  const { label, blocks } = splitTask(node);
  return [
    ...label.map((child) => ({ node: child, isTight, isInteractive: true })),
    ...blocks.map((child) => ({ node: child, isTight, isInteractive })),
  ];
}

function renderEntries(entries: RenderEntry[], context: RenderContext): ReactNode[] {
  return mapTreeToDepth<RenderEntry, ReactNode>(entries, {
    getChildren: listChildEntries,
    transform: (entry, children, index) => (
      <Fragment key={entry.key ?? index}>{renderNode(entry, children, context)}</Fragment>
    ),
    maxDepth: maxMarkupDepth,
  });
}

/** Renders nodes from the leaves up, without recursion, so deep nesting cannot overflow the stack. */
function renderAll(nodes: readonly MarkdownNode[], context: RenderContext): ReactNode[] {
  return renderEntries(
    nodes.map((node) => ({ node, isTight: false, isInteractive: false })),
    context,
  );
}

/** The element of a document's top-level block, keyed by its position. */
export function renderMarkdownBlock(
  block: MarkdownBlock,
  index: number,
  context: RenderContext,
): ReactNode {
  return renderEntries(
    [{ node: block, isTight: false, isInteractive: false, key: index }],
    context,
  )[0];
}

function renderNode(entry: RenderEntry, mapped: ReactNode[], context: RenderContext): ReactNode {
  const { node } = entry;
  const children = 'children' in node ? mapped : null;
  const custom = context.renderNode?.(node, children, { isInteractive: entry.isInteractive });
  if (custom !== undefined) return custom;
  return isInline(node)
    ? renderInline(node, children, context)
    : renderBlock({ node, isTight: entry.isTight }, mapped, context);
}

function isInline(node: MarkdownNode): node is MarkdownInline {
  return inlineTypes.has(node.type);
}

/** The fragment percent-decoded once, or as written when its escapes are malformed. */
function decodeFragment(fragment: string): string {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

/**
 * The heading id a fragment names: as written or percent-decoded once, compared as is and with
 * the accents folded the way heading slugs fold them.
 */
function findHeadingId(fragment: string, ids: ReadonlySet<string>): string | undefined {
  for (const candidate of new Set([fragment, decodeFragment(fragment)])) {
    const folded = candidate.normalize('NFKD').replace(/\p{M}/gu, '');
    if (ids.has(candidate)) return candidate;
    if (ids.has(folded)) return folded;
  }
  return undefined;
}

/** A link to a heading of the document follows the heading's prefixed id. */
function resolveHref(href: string, context: RenderContext): string {
  const { headingIdPrefix } = context;
  if (headingIdPrefix === undefined || !href.startsWith('#')) return href;
  const id = findHeadingId(href.slice(1), context.headingIds);
  return id === undefined ? href : `#${headingIdPrefix}${id}`;
}

function renderInline(node: MarkdownInline, children: ReactNode, context: RenderContext) {
  switch (node.type) {
    case 'text':
      return <TextMatch>{node.text}</TextMatch>;
    case 'inlineCode':
      return (
        <code {...hooks.slot('code')}>
          <TextMatch>{node.text}</TextMatch>
        </code>
      );
    case 'emphasis':
      return <em>{children}</em>;
    case 'strong':
      return <strong>{children}</strong>;
    case 'strikethrough':
      return <del>{children}</del>;
    case 'link':
      return (
        <Link
          href={resolveHref(node.href, context)}
          isExternal={externalUrl.test(node.href)}
          title={node.title || undefined}
        >
          {children}
        </Link>
      );
    case 'image':
      return (
        <img
          {...hooks.slot('image')}
          {...untrustedImageProps}
          src={node.src}
          alt={node.alt}
          title={node.title || undefined}
        />
      );
    case 'lineBreak':
      return <br />;
  }
}

function renderTable(node: MarkdownTable, context: RenderContext) {
  const header = node.header.map((cell, column) => ({
    key: String(column),
    content: renderAll(cell, context),
    align: node.align[column] ?? undefined,
  }));
  const rows = node.rows.map((row, index) => ({
    key: String(index),
    cells: row.map((cell, column) => ({ key: String(column), content: renderAll(cell, context) })),
  }));
  return <ProseTable header={header} rows={rows} />;
}

/** A task item: a read-only checkbox labelled by the item's first paragraph, then the rest. */
function renderTask(node: MarkdownListItem, checked: boolean, children: ReactNode[]) {
  const labelLength = splitTask(node).label.length;
  return (
    <li {...hooks.slot('task')}>
      <Checkbox size="sm" isReadOnly isSelected={checked}>
        {children.slice(0, labelLength)}
      </Checkbox>
      {children.slice(labelLength)}
    </li>
  );
}

function renderBlock(
  { node, isTight }: { node: Exclude<MarkdownNode, MarkdownInline>; isTight: boolean },
  children: ReactNode[],
  context: RenderContext,
) {
  switch (node.type) {
    case 'heading': {
      const { headingIdPrefix } = context;
      const id = headingIdPrefix === undefined ? undefined : headingIdPrefix + node.id;
      return createElement(`h${node.level}`, { id }, children);
    }
    case 'paragraph':
      return isTight ? children : <p>{children}</p>;
    case 'codeBlock':
      return (
        <pre {...hooks.slot('code-block', { language: node.language })}>
          <code>
            <TextMatch>{node.text}</TextMatch>
          </code>
        </pre>
      );
    case 'blockquote':
      return <blockquote>{children}</blockquote>;
    case 'list':
      if (!node.ordered) return <ul>{children}</ul>;
      return <ol start={node.start === 1 ? undefined : node.start}>{children}</ol>;
    case 'listItem':
      return node.checked === null ? <li>{children}</li> : renderTask(node, node.checked, children);
    case 'table':
      return renderTable(node, context);
    case 'thematicBreak':
      return <Separator />;
  }
}
