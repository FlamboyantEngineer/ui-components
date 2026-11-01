import { describe, expect, it } from 'vitest';
import type { ChatTextToken } from './chat-part.js';
import {
  listTextTokens,
  splitTextTokens,
  splitTokenMarkers,
  writeTokenSource,
} from './chat-text-tokens.js';

/** The Markdown source `writeTokenSource` writes. */
function sourceOf(text: string, tokens: readonly ChatTextToken[]) {
  return writeTokenSource(text, tokens).source;
}

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
    expect(splitTokenMarkers('Ask \uFFF90\uFFFB now', 1, '\uFFF9')).toEqual(['Ask ', 0, ' now']);
    expect(splitTokenMarkers('\uFFF91\uFFFB', 1, '\uFFF9')).toEqual(['\uFFF91\uFFFB']);
    expect(splitTokenMarkers('plain', 1, '\uFFF9')).toEqual(['plain']);
  });
});

describe('writeTokenSource', () => {
  it('UIC-CHAT-PARTS-2.4 puts a marker in place of each token Markdown reads as text', () => {
    expect(sourceOf('Ask @Ana **now**', [ana])).toBe('Ask \uFFF90\uFFFB **now**');
    expect(sourceOf('Ask @Ana', [])).toBe('Ask @Ana');
  });

  it('UIC-CHAT-PARTS-2.4 keeps the text of tokens in code, link targets and images', () => {
    const inCode = { ...ana, start: 5, end: 9 };
    expect(sourceOf('Ask `@Ana` and @Ana', [inCode, { ...ana, start: 15, end: 19 }])).toBe(
      'Ask `@Ana` and \uFFF91\uFFFB',
    );
    expect(sourceOf('See [it](@Ana)', [{ ...ana, start: 9, end: 13 }])).toBe('See [it](@Ana)');
    expect(sourceOf('A ![@Ana](a.png)', [{ ...ana, start: 4, end: 8 }])).toBe('A ![@Ana](a.png)');
    const table = '| a |\n| --- |\n| `@Ana` |';
    expect(sourceOf(table, [{ ...ana, start: 17, end: 21 }])).toBe(table);
  });
});

describe('token markers and literal text', () => {
  const alice: ChatTextToken = { start: 0, end: 2, kind: 'mention', id: 'a', label: 'Alice' };

  it('UIC-CHAT-PARTS-2.4 opens markers with a run longer than any run of anchors in the text', () => {
    const text = '@A literal \uFFF90\uFFFB and \uFFF9\uFFF9';
    const { source, marker } = writeTokenSource(text, [alice]);
    expect(marker).toBe('\uFFF9\uFFF9\uFFF9');
    expect(source).toBe(`${marker}0\uFFFB literal \uFFF90\uFFFB and \uFFF9\uFFF9`);
    expect(splitTokenMarkers(source, 1, marker)).toEqual([
      0,
      ' literal \uFFF90\uFFFB and \uFFF9\uFFF9',
    ]);
  });

  it('UIC-CHAT-PARTS-2.4 counts anchors that Markdown decodes from entities', () => {
    const text = '@A and &#xFFF9;&#xFFF9;0&#xFFFB;';
    const { marker } = writeTokenSource(text, [alice]);
    expect(marker).toBe('\uFFF9\uFFF9\uFFF9');
  });

  it('UIC-CHAT-PARTS-2.4 keeps an anchor beside a marker as text', () => {
    const text = '\uFFF9@A\uFFFB';
    const token = { ...alice, start: 1, end: 3 };
    const { source, marker } = writeTokenSource(text, [token]);
    expect(splitTokenMarkers(source, 1, marker)).toEqual(['\uFFF9', 0, '\uFFFB']);
  });
});
