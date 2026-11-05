import { describe, expect, it } from 'vitest';
import { type CodeDecorations, splitSegments } from './code-segments.js';

const empty = { matches: [], brackets: [], caret: null };

describe('code decoration segments', () => {
  it('UIC-CODE-EDITOR-3.4 keeps the worst severity across unsorted and overlapping ranges', () => {
    const decorations: CodeDecorations = {
      ...empty,
      marks: [
        { start: 4, end: 7, severity: 'warning' },
        { start: 1, end: 5, severity: 'error' },
        { start: 0, end: 3, severity: 'warning' },
      ],
      matches: [{ start: 2, end: 6, isCurrent: true }],
      brackets: [{ start: 0, end: 1, isUnmatched: false }],
      caret: 4,
    };
    const segments = splitSegments([{ text: 'abcd' }, { text: 'efgh', type: 'name' }], decorations);
    expect(segments).toEqual([
      { text: 'a', type: null, severity: 'warning', match: null, bracket: { isUnmatched: false } },
      { text: 'b', type: null, severity: 'error', match: null, bracket: null },
      { text: 'c', type: null, severity: 'error', match: { isCurrent: true }, bracket: null },
      { text: 'd', type: null, severity: 'error', match: { isCurrent: true }, bracket: null },
      null,
      { text: 'e', type: 'name', severity: 'error', match: { isCurrent: true }, bracket: null },
      { text: 'f', type: 'name', severity: 'warning', match: { isCurrent: true }, bracket: null },
      { text: 'g', type: 'name', severity: 'warning', match: null, bracket: null },
      { text: 'h', type: 'name', severity: null, match: null, bracket: null },
    ]);
  });

  it('UIC-CODE-EDITOR-3.4 reads each diagnostic a bounded number of times for many marked tokens', () => {
    let reads = 0;
    const length = 10000;
    const marks: CodeDecorations['marks'] = Array.from({ length }, (_, start) => ({
      get start() {
        reads += 1;
        return start;
      },
      end: start + 1,
      severity: 'warning' as const,
    }));
    const segments = splitSegments([{ text: 'a'.repeat(length) }], { ...empty, marks });
    expect(segments).toHaveLength(length);
    expect(segments.every((segment) => segment?.severity === 'warning')).toBe(true);
    expect(reads).toBeLessThanOrEqual(length * 3);
  });
});
