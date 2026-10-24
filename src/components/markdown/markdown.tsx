import { createElement, Fragment, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { mapTree } from '../../utils/map-tree.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Link } from '../link/link.js';
import { ProseTable } from '../prose-table/prose-table.js';
import { Separator } from '../separator/separator.js';
import { TextMatch } from '../text-match/text-match.js';
import { listMarkdownHeadings } from './markdown-headings.js';
import type {
  MarkdownDocument,
  MarkdownInline,
  MarkdownListItem,
  MarkdownNode,
  MarkdownTable,
} from './markdown-nodes.js';
import { parseMarkdown } from './parse-markdown.js';

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
}

interface RenderContext {
  renderNode: MarkdownProps['renderNode'];
  headingIdPrefix: string | undefined;
  headingIds: ReadonlySet<string>;
}

/** A node to render, and whether it sits directly in an item of a tight list. */
interface RenderEntry {
  node: MarkdownNode;
  isTight: boolean;
}

const hooks = createHooks('markdown', ['code-block', 'code', 'task', 'image']);

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
 * its first paragraph, then its other blocks, so every node renders once.
 */
function listChildEntries({ node, isTight }: RenderEntry): RenderEntry[] | undefined {
  if (!('children' in node)) return undefined;
  if (node.type === 'list') {
    return node.children.map((item) => ({ node: item, isTight: node.tight }));
  }
  if (node.type !== 'listItem') {
    return node.children.map((child) => ({ node: child, isTight: false }));
  }
  const { label, blocks } = splitTask(node);
  const children = node.checked === null ? node.children : [...label, ...blocks];
  return children.map((child) => ({ node: child, isTight }));
}

/** Renders nodes from the leaves up, without recursion, so deep nesting cannot overflow the stack. */
function renderAll(nodes: readonly MarkdownNode[], context: RenderContext): ReactNode[] {
  return mapTree<RenderEntry, ReactNode>(
    nodes.map((node) => ({ node, isTight: false })),
    listChildEntries,
    (entry, children, index) => (
      <Fragment key={index}>{renderNode(entry, children, context)}</Fragment>
    ),
  );
}

function renderNode(entry: RenderEntry, mapped: ReactNode[], context: RenderContext): ReactNode {
  const { node } = entry;
  const children = 'children' in node ? mapped : null;
  const custom = context.renderNode?.(node, children);
  if (custom !== undefined) return custom;
  return isInline(node)
    ? renderInline(node, children, context)
    : renderBlock({ node, isTight: entry.isTight }, mapped, context);
}

function isInline(node: MarkdownNode): node is MarkdownInline {
  return inlineTypes.has(node.type);
}

/** A link to a heading of the document follows the heading's prefixed id. */
function resolveHref(href: string, context: RenderContext): string {
  const { headingIdPrefix } = context;
  if (headingIdPrefix === undefined || !href.startsWith('#')) return href;
  const id = href.slice(1);
  return context.headingIds.has(id) ? `#${headingIdPrefix}${id}` : href;
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
        <Link href={resolveHref(node.href, context)} isExternal={externalUrl.test(node.href)}>
          {children}
        </Link>
      );
    case 'image':
      return (
        <img
          {...hooks.slot('image')}
          src={node.src}
          alt={node.alt}
          title={node.title ?? undefined}
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

/**
 * Renders Markdown as React elements: headings, paragraphs, lists and task lists, block quotes,
 * code, tables through `ProseTable`, links through `Link` and text through `TextMatch`. Raw HTML
 * shows as text.
 */
export function Markdown({
  source,
  headingIdPrefix,
  renderNode: customRender,
  className,
  ...rest
}: MarkdownProps) {
  const tree = useMemo(
    () => (typeof source === 'string' ? parseMarkdown(source) : source),
    [source],
  );
  const headingIds = useMemo(
    () => new Set(listMarkdownHeadings(tree).map((heading) => heading.id)),
    [tree],
  );
  const context: RenderContext = {
    renderNode: customRender,
    headingIdPrefix,
    headingIds,
  };
  return (
    <div {...rest} {...hooks.root({ className })}>
      {renderAll(tree.children, context)}
    </div>
  );
}
