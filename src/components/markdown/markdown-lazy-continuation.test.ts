import { describe, expect, it } from 'vitest';
import type { MarkdownBlock } from './markdown-nodes.js';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseMarkdown } from './parse-markdown.js';
import { parseStreamingMarkdown, type StreamingMarkdownParse } from './parse-streaming-markdown.js';

/** The block structure as compact text: block types with their children, paragraphs by text. */
function outline(nodes: readonly MarkdownBlock[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'paragraph' || node.type === 'heading') {
        const text = node.children.map((child) => ('text' in child ? child.text : '')).join('');
        return `${node.type}(${text})`;
      }
      if (node.type === 'codeBlock') return `code(${node.text})`;
      if (node.type === 'blockquote') return `blockquote[${outline(node.children)}]`;
      if (node.type === 'list') {
        return `list[${node.children.map((item) => `item[${outline(item.children)}]`).join(' ')}]`;
      }
      return node.type;
    })
    .join(' ');
}

const parse = (source: string) => outline(parseMarkdown(source).children);

describe('Markdown lazy continuation', () => {
  it('UIC-MARKDOWN-1.5 ends a block quote whose last block is no paragraph', () => {
    expect(parse('> # Heading\noutside')).toBe('blockquote[heading(Heading)] paragraph(outside)');
    expect(parse('> ```\n> code\noutside\n> ```')).toBe(
      'blockquote[code(code)] paragraph(outside) blockquote[code()]',
    );
    expect(parse('> ---\noutside')).toBe('blockquote[thematicBreak] paragraph(outside)');
    expect(parse('>     indented\noutside')).toBe('blockquote[code(indented)] paragraph(outside)');
    expect(parse('> a\n> ===\noutside')).toBe('blockquote[heading(a)] paragraph(outside)');
  });

  it('UIC-MARKDOWN-1.6 ends a list item whose last block is no paragraph', () => {
    expect(parse('- # Heading\noutside')).toBe('list[item[heading(Heading)]] paragraph(outside)');
    expect(parse('- ```\n  code\n  ```\noutside')).toBe(
      'list[item[code(code)]] paragraph(outside)',
    );
  });

  it('UIC-MARKDOWN-1.5 UIC-MARKDOWN-1.6 continues an open paragraph lazily, nested or not', () => {
    expect(parse('> a\nb')).toBe('blockquote[paragraph(a\nb)]');
    expect(parse('- a\nb')).toBe('list[item[paragraph(a\nb)]]');
    expect(parse('> # h\n> a\nb')).toBe('blockquote[heading(h) paragraph(a\nb)]');
    expect(parse('> - a\nb')).toBe('blockquote[list[item[paragraph(a\nb)]]]');
    expect(parse('> > a\nb')).toBe('blockquote[blockquote[paragraph(a\nb)]]');
    expect(parse('- > a\nb')).toBe('list[item[blockquote[paragraph(a\nb)]]]');
    // A line indented to a nested item's content column continues that item's paragraph.
    expect(parse('> - a\n>   - b\n>\n>     c\nd')).toBe(
      'blockquote[list[item[paragraph(a) list[item[paragraph(b) paragraph(c\nd)]]]]]',
    );
  });

  it('UIC-MARKDOWN-1.5 UIC-MARKDOWN-1.6 ends nested containers whose innermost block is no paragraph', () => {
    expect(parse('> - # h\nb')).toBe('blockquote[list[item[heading(h)]]] paragraph(b)');
    expect(parse('> > # h\nb')).toBe('blockquote[blockquote[heading(h)]] paragraph(b)');
    expect(parse('- > # h\nb')).toBe('list[item[blockquote[heading(h)]]] paragraph(b)');
  });

  it('UIC-MARKDOWN-1.5 continues lazily again once a closed fence is followed by a paragraph', () => {
    expect(parse('> ```\n> x\n> ```\n> a\nb')).toBe('blockquote[code(x) paragraph(a\nb)]');
  });

  it('UIC-MARKDOWN-2.13 streams the same structure at every chunk', () => {
    const source =
      '> # Heading\noutside\n\n- # Item\nafter\n\n> ```\n> code\nlazy\n> ```\n\n> a\nb';
    let previous: StreamingMarkdownParse | null = null;
    for (let end = 1; end <= source.length; end += 1) {
      const prefix = prepareStreamingMarkdown(source.slice(0, end));
      previous = parseStreamingMarkdown(prefix, previous);
      expect(previous.document).toEqual(parseMarkdown(prefix));
    }
  });
});
