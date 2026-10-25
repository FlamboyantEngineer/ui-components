import { describe, expect, it } from 'vitest';
import type { ChatTextToken } from './chat-part.js';
import {
  listTextTokens,
  splitTextTokens,
  splitTokenMarkers,
  writeTokenSource,
} from './chat-text-tokens.js';

const ana: ChatTextToken = { start: 4, end: 8, kind: 'mention', id: 'ana', label: 'Ana Lopez' };
const plan: ChatTextToken = { start: 0, end: 5, kind: 'command', id: 'plan', label: '/plan' };

describe('listTextTokens', () => {
  it('UIC-CHAT-PARTS-2.4 orders the tokens and drops those outside the text or overlapping', () => {
    const text = '/plan @Ana';
    const late: ChatTextToken = { ...ana, start: 6, end: 10 };
    expect(listTextTokens(text, [late, plan])).toEqual([plan, late]);
    expect(listTextTokens(text, [plan, { ...late, start: 3 }])).toEqual([plan]);
    expect(
      listTextTokens(text, [
        { ...late, end: 11 },
        { ...late, start: 6, end: 6 },
      ]),
    ).toEqual([]);
    expect(listTextTokens(text, undefined)).toEqual([]);
  });
});

describe('splitTextTokens', () => {
  it('UIC-CHAT-PARTS-2.4 splits text at its tokens', () => {
    expect(splitTextTokens('Ask @Ana now', [ana])).toEqual(['Ask ', 0, ' now']);
    expect(splitTextTokens('/plan', [plan])).toEqual([0]);
    expect(splitTextTokens('No tokens', [])).toEqual(['No tokens']);
  });
});

describe('splitTokenMarkers', () => {
  it('UIC-CHAT-PARTS-2.4 splits rendered text at markers of known tokens only', () => {
    expect(splitTokenMarkers('Ask \uFFF90\uFFFB now', 1)).toEqual(['Ask ', 0, ' now']);
    expect(splitTokenMarkers('\uFFF91\uFFFB', 1)).toEqual(['\uFFF91\uFFFB']);
    expect(splitTokenMarkers('plain', 1)).toEqual(['plain']);
  });
});

describe('writeTokenSource', () => {
  it('UIC-CHAT-PARTS-2.4 puts a marker in place of each token Markdown reads as text', () => {
    expect(writeTokenSource('Ask @Ana **now**', [ana])).toBe('Ask \uFFF90\uFFFB **now**');
    expect(writeTokenSource('Ask @Ana', [])).toBe('Ask @Ana');
  });

  it('UIC-CHAT-PARTS-2.4 keeps the text of tokens in code, link targets and images', () => {
    const inCode = { ...ana, start: 5, end: 9 };
    expect(writeTokenSource('Ask `@Ana` and @Ana', [inCode, { ...ana, start: 15, end: 19 }])).toBe(
      'Ask `@Ana` and \uFFF91\uFFFB',
    );
    expect(writeTokenSource('See [it](@Ana)', [{ ...ana, start: 9, end: 13 }])).toBe(
      'See [it](@Ana)',
    );
    expect(writeTokenSource('A ![@Ana](a.png)', [{ ...ana, start: 4, end: 8 }])).toBe(
      'A ![@Ana](a.png)',
    );
    const table = '| a |\n| --- |\n| `@Ana` |';
    expect(writeTokenSource(table, [{ ...ana, start: 17, end: 21 }])).toBe(table);
  });
});
