'use client';

// A question's text as Markdown: its title, the blocks after it, and its words.

import type { ReactNode } from 'react';
import { walkTree } from '../../utils/walk-tree.js';
import {
  Markdown,
  type MarkdownDocument,
  type MarkdownNode,
  parseMarkdown,
  renderMarkdownInlines,
} from '../markdown/markdown.js';

/** A question read as Markdown. */
interface QuestionText {
  /**
   * The opening paragraph or heading as inline elements, which can sit in a legend or a term; the
   * whole question when it opens with another block.
   */
  title: ReactNode;
  /** The blocks after the title, or `null` when there are none. */
  body: MarkdownDocument | null;
  /** The title's words without their formatting, which name the card and a free-text field. */
  words: string;
}

/** Inline nodes whose words run on into the text around them, with no space between. */
const runningTypes: ReadonlySet<string> = new Set(['emphasis', 'strong', 'strikethrough', 'link']);

/** The words of Markdown nodes: their text and code and image alt text, a space between blocks. */
function readWords(nodes: readonly MarkdownNode[]): string {
  const words: string[] = [];
  const children = (node: MarkdownNode) => ('children' in node ? node.children : undefined);
  for (const node of walkTree<MarkdownNode>(nodes, children)) {
    if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'codeBlock') {
      words.push(node.text);
    } else if (node.type === 'image') {
      words.push(node.alt);
    } else if (!runningTypes.has(node.type)) {
      words.push(' ');
    }
  }
  return words.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Reads a question as Markdown: an opening paragraph or heading is its title and the blocks after
 * it its body; a question that opens with another block, such as a list, is all title. Raw HTML
 * stays text, as in every `Markdown`.
 */
export function readQuestionText(question: string): QuestionText {
  const document = parseMarkdown(question);
  const [first, ...rest] = document.children;
  if (first?.type !== 'paragraph' && first?.type !== 'heading') {
    return {
      title: <Markdown source={document} />,
      body: null,
      words: readWords(document.children),
    };
  }
  return {
    title: renderMarkdownInlines(first.children),
    body: rest.length > 0 ? { type: 'document', children: rest } : null,
    words: readWords(first.children),
  };
}

/**
 * An option's description as Markdown: one paragraph as inline elements, which fit the line under
 * the label, and several blocks as a `Markdown` block.
 */
export function renderOptionDescription(description: string): ReactNode {
  const document = parseMarkdown(description);
  const [first, ...rest] = document.children;
  return first?.type === 'paragraph' && rest.length === 0 ? (
    renderMarkdownInlines(first.children)
  ) : (
    <Markdown source={document} />
  );
}
