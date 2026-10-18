// Heading ids and the outline of a parsed Markdown document (specs/MARKDOWN.md).

import type { OutlineHeading } from '../outline/outline.js';
import type { MarkdownBlock, MarkdownDocument, MarkdownInline } from './markdown-nodes.js';

/** The text inline nodes read as: link and emphasis text, code, image alt text. */
export function toPlainText(nodes: readonly MarkdownInline[]): string {
  return nodes
    .map((node) => {
      if ('children' in node) return toPlainText(node.children);
      if (node.type === 'image') return node.alt;
      return node.type === 'lineBreak' ? ' ' : node.text;
    })
    .join('');
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
  return (text) => {
    const base = slugifyHeading(text);
    let id = base;
    for (let count = 2; used.has(id); count += 1) id = `${base}-${count}`;
    used.add(id);
    return id;
  };
}

function collectHeadings(blocks: readonly MarkdownBlock[], prefix: string): OutlineHeading[] {
  return blocks.flatMap((block): OutlineHeading[] => {
    if (block.type === 'heading') {
      return [{ id: prefix + block.id, label: toPlainText(block.children), level: block.level }];
    }
    if (block.type === 'blockquote') return collectHeadings(block.children, prefix);
    if (block.type === 'list') {
      return block.children.flatMap((item) => collectHeadings(item.children, prefix));
    }
    return [];
  });
}

/**
 * The document's headings in order, as `Outline` takes them, with ids carrying the same
 * `headingIdPrefix` the `Markdown` that renders the document uses.
 */
export function listMarkdownHeadings(
  document: MarkdownDocument,
  headingIdPrefix = '',
): OutlineHeading[] {
  return collectHeadings(document.children, headingIdPrefix);
}
