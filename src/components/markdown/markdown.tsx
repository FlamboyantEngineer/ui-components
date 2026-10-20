import { createElement, Fragment, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
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
  /** The paragraphs being rendered sit directly in an item of a tight list. */
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

function renderAll(nodes: readonly MarkdownNode[], context: RenderContext): ReactNode[] {
  return nodes.map((node, index) => <Fragment key={index}>{renderNode(node, context)}</Fragment>);
}

function renderChildren(node: MarkdownNode, context: RenderContext): ReactNode {
  if (!('children' in node)) return null;
  if (node.type === 'list') return renderAll(node.children, { ...context, isTight: node.tight });
  const isTight = node.type === 'listItem' && context.isTight;
  return renderAll(node.children, { ...context, isTight });
}

function renderNode(node: MarkdownNode, context: RenderContext): ReactNode {
  const children = renderChildren(node, context);
  const custom = context.renderNode?.(node, children);
  if (custom !== undefined) return custom;
  return isInline(node)
    ? renderInline(node, children, context)
    : renderBlock(node, children, context);
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
function renderTask(node: MarkdownListItem, checked: boolean, context: RenderContext) {
  const [first, ...rest] = node.children;
  const label = first?.type === 'paragraph' ? first.children : [];
  const blocks = first?.type === 'paragraph' ? rest : node.children;
  return (
    <li {...hooks.slot('task')}>
      <Checkbox size="sm" isReadOnly isSelected={checked}>
        {renderAll(label, context)}
      </Checkbox>
      {renderAll(blocks, context)}
    </li>
  );
}

function renderBlock(
  node: Exclude<MarkdownNode, MarkdownInline>,
  children: ReactNode,
  context: RenderContext,
) {
  switch (node.type) {
    case 'heading': {
      const { headingIdPrefix } = context;
      const id = headingIdPrefix === undefined ? undefined : headingIdPrefix + node.id;
      return createElement(`h${node.level}`, { id }, children);
    }
    case 'paragraph':
      return context.isTight ? children : <p>{children}</p>;
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
      return node.checked === null ? <li>{children}</li> : renderTask(node, node.checked, context);
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
    isTight: false,
  };
  return (
    <div {...rest} {...hooks.root({ className })}>
      {renderAll(tree.children, context)}
    </div>
  );
}
