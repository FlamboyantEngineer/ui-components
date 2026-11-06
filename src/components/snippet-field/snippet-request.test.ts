import { describe, expect, it } from 'vitest';
import { isSameSnippetRequest, readSnippetLines, toSnippetLinesText } from './snippet-request.js';

describe('snippet requests', () => {
  it('UIC-SNIPPET-FIELD-1.2 reads whole-number ranges, the whole source and unreadable ranges', () => {
    expect(readSnippetLines('', ' ')).toEqual({ ok: true, lines: null });
    expect(readSnippetLines('3', '8')).toEqual({ ok: true, lines: { start: 3, end: 8 } });
    expect(readSnippetLines('4', '4')).toEqual({ ok: true, lines: { start: 4, end: 4 } });
    expect(readSnippetLines('3', '')).toEqual({ ok: false, reason: 'incomplete' });
    expect(readSnippetLines('0', '2')).toEqual({ ok: false, reason: 'incomplete' });
    expect(readSnippetLines('1.5', '2')).toEqual({ ok: false, reason: 'incomplete' });
    expect(readSnippetLines('x', '2')).toEqual({ ok: false, reason: 'incomplete' });
    expect(readSnippetLines('9', '2')).toEqual({ ok: false, reason: 'order' });
    expect(toSnippetLinesText({ start: 2, end: 5 })).toEqual({ start: '2', end: '5' });
    expect(toSnippetLinesText(null)).toEqual({ start: '', end: '' });
    expect(
      isSameSnippetRequest(
        { source: 'a', lines: null },
        { source: 'a', lines: { start: 1, end: 1 } },
      ),
    ).toBe(false);
  });
});
