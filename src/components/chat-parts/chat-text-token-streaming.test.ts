import { describe, expect, it, vi } from 'vitest';
import type * as ParseModule from '../markdown/parse-markdown.js';
import { writeTokenSource } from './chat-text-tokens.js';

const parsed = vi.hoisted(() => ({ length: 0 }));

// Counts the source the token analysis parses, to check that a growing text parses only its end.
vi.mock('../markdown/parse-markdown.js', async (importOriginal) => {
  const actual = await importOriginal<typeof ParseModule>();
  return {
    ...actual,
    parseMarkdownBlocks: (...args: Parameters<typeof actual.parseMarkdownBlocks>) => {
      parsed.length += args[0].length;
      return actual.parseMarkdownBlocks(...args);
    },
  };
});

describe('writeTokenSource while a text streams', () => {
  it('UIC-CHAT-PARTS-2.4 parses only the unsettled end of a text that continues the last one', () => {
    const token = { kind: 'mention', id: 'ana', label: 'Ana', start: 0, end: 4 } as const;
    const paragraph = 'A finished paragraph with `code` and [a link](https://example.com).\n\n';
    let text = '@Ana says\n\n';
    let written = writeTokenSource(text, [token]);
    const perChunk: number[] = [];
    for (let chunk = 0; chunk < 200; chunk += 1) {
      text += paragraph;
      parsed.length = 0;
      written = writeTokenSource(text, [token], written.parses);
      perChunk.push(parsed.length);
      expect(written.source).toBe(writeTokenSource(text, [token]).source);
    }
    // The work per chunk stays the same however long the text grows.
    expect(Math.max(...perChunk.slice(100))).toBeLessThanOrEqual(
      Math.max(...perChunk.slice(0, 10)),
    );
    expect(Math.max(...perChunk)).toBeLessThan(paragraph.length * 8);
  });
});
