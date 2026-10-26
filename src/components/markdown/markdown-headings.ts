// Heading ids and the outline of a parsed Markdown document (specs/MARKDOWN.md).

import type { OutlineHeading } from '../outline/outline.js';
import { walkTree } from '../../utils/walk-tree.js';
import type {
  MarkdownDocument,
  MarkdownInline,
  MarkdownBlock,
  MarkdownListItem,
} from './markdown-nodes.js';

/** The text inline nodes read as: link and emphasis text, code, image alt text. */
export function toPlainText(nodes: readonly MarkdownInline[]): string {
  const text: string[] = [];
  for (const node of walkTree(nodes, (item) => ('children' in item ? item.children : undefined))) {
    if ('children' in node) continue;
    if (node.type === 'image') text.push(node.alt);
    else text.push(node.type === 'lineBreak' ? ' ' : node.text);
  }
  return text.join('');
}

/** Lower case, accents folded, every run of other characters than letters and digits a hyphen. */
function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/** Hands out heading slugs, suffixing repeats `-2`, `-3`, … so they stay unique in a document. */
export function createHeadingIdAllocator(): (text: string) => string {
  const used = new Set<string>();
  const nextSuffix = new Map<string, number>();
  return (text) => {
    const base = slugifyHeading(text);
    let id = base;
    let count = nextSuffix.get(base) ?? 2;
    while (used.has(id)) id = `${base}-${count++}`;
    nextSuffix.set(base, count);
    used.add(id);
    return id;
  };
}

/**
 * The document's headings in order, as `Outline` takes them, with ids carrying the same
 * `headingIdPrefix` the `Markdown` that renders the document uses.
 */
export function listMarkdownHeadings(
  document: MarkdownDocument,
  headingIdPrefix = '',
): OutlineHeading[] {
  const headings: OutlineHeading[] = [];
  const getChildren = (node: MarkdownBlock | MarkdownListItem) =>
    node.type === 'blockquote' || node.type === 'list' || node.type === 'listItem'
      ? node.children
      : undefined;
  for (const block of walkTree<MarkdownBlock | MarkdownListItem>(document.children, getChildren)) {
    if (block.type !== 'heading') continue;
    headings.push({
      id: headingIdPrefix + block.id,
      label: toPlainText(block.children),
      level: block.level,
    });
  }
  return headings;
}
