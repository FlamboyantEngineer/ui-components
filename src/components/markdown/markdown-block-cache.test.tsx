import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { Markdown } from './markdown.js';
import { signMarkdownNode } from './markdown-block-cache.js';
import type { MarkdownNode } from './markdown-nodes.js';
import { parseMarkdown } from './parse-markdown.js';

const paragraphs = [
  'Lisbon has mild winters and long, sunny summers.',
  'Porto is three hours north by train.',
  'Book the coastal line early in **August**.',
  'Sintra makes an easy day trip.',
];

/** The stream of chunks that writes the paragraphs, three chunks each. */
function streamChunks(): string[] {
  const sources: string[] = [];
  let text = '';
  for (const [index, paragraph] of paragraphs.entries()) {
    const third = Math.ceil(paragraph.length / 3);
    for (let part = 0; part < 3; part += 1) {
      if (part === 0 && index > 0) text += '\n\n';
      text += paragraph.slice(part * third, (part + 1) * third);
      sources.push(text);
    }
  }
  return sources;
}

/** Counts `renderNode` calls for paragraphs and the renders of the component it draws them with. */
function createCounter() {
  const counts = { calls: 0, renders: 0 };
  function CountedParagraph({ children }: { children: ReactNode }) {
    counts.renders += 1;
    return <p>{children}</p>;
  }
  const renderNode = (node: MarkdownNode, children: ReactNode) => {
    if (node.type !== 'paragraph') return undefined;
    counts.calls += 1;
    return <CountedParagraph>{children}</CountedParagraph>;
  };
  return { counts, renderNode };
}

describe('useMarkdownBlocks', () => {
  it('UIC-MARKDOWN-2.12 UIC-MARKDOWN-2.13 renders only the last block for each chunk of a stream', () => {
    const chunks = streamChunks();
    const { counts, renderNode } = createCounter();
    const { rerender } = render(
      <Markdown source={requireDefined(chunks[0])} isStreaming renderNode={renderNode} />,
    );
    for (const source of chunks.slice(1)) {
      rerender(<Markdown source={source} isStreaming renderNode={renderNode} />);
    }
    expect(screen.getAllByRole('paragraph').map((paragraph) => paragraph.textContent)).toEqual(
      paragraphs.map((paragraph) => paragraph.replaceAll('**', '')),
    );
    // One paragraph per chunk: the one the chunk grew.
    expect(counts).toEqual({ calls: chunks.length, renders: chunks.length });
  });

  it('UIC-MARKDOWN-2.12 renders every block again without streaming, or for a new renderNode', () => {
    const chunks = streamChunks();
    const plain = createCounter();
    const { rerender } = render(
      <Markdown source={requireDefined(chunks[0])} renderNode={plain.renderNode} />,
    );
    for (const source of chunks.slice(1)) {
      rerender(<Markdown source={source} renderNode={plain.renderNode} />);
    }
    const written = chunks.map((source) => source.split('\n\n').length);
    expect(plain.counts.calls).toBe(written.reduce((sum, count) => sum + count, 0));
    const next = createCounter();
    rerender(
      <Markdown source={requireDefined(chunks.at(-1))} isStreaming renderNode={next.renderNode} />,
    );
    expect(next.counts.calls).toBe(paragraphs.length);
  });

  it('UIC-MARKDOWN-2.12 renders nothing again for the same source and renderNode', () => {
    const { counts, renderNode } = createCounter();
    const source = paragraphs.join('\n\n');
    const { rerender } = render(<Markdown source={source} renderNode={renderNode} />);
    rerender(<Markdown source={source} renderNode={renderNode} className="again" />);
    expect(counts).toEqual({ calls: paragraphs.length, renders: paragraphs.length });
  });

  it('UIC-MARKDOWN-2.12 keeps a block that renderNode hid', () => {
    let calls = 0;
    const renderNode = (node: MarkdownNode) => {
      if (node.type !== 'heading') return undefined;
      calls += 1;
      return null;
    };
    const { rerender, container } = render(
      <Markdown source={'# Hidden\n\nText'} isStreaming renderNode={renderNode} />,
    );
    rerender(<Markdown source={'# Hidden\n\nText grows'} isStreaming renderNode={renderNode} />);
    expect(calls).toBe(1);
    expect(container.querySelector('h1')).toBeNull();
  });
});

describe('signMarkdownNode', () => {
  it('UIC-MARKDOWN-2.12 signs blocks by their content, without recursive calls', () => {
    const [first, second, third] = parseMarkdown('A *b*\n\nA *b*\n\nA **b**').children;
    expect(signMarkdownNode(requireDefined(first))).toBe(signMarkdownNode(requireDefined(second)));
    expect(signMarkdownNode(requireDefined(first))).not.toBe(
      signMarkdownNode(requireDefined(third)),
    );
    const deep = requireDefined(parseMarkdown('>'.repeat(5000) + ' deep').children[0]);
    expect(signMarkdownNode(deep)).toContain('"deep"');
  });
});
