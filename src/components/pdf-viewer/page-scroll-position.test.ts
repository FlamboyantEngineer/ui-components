import { describe, expect, it, vi } from 'vitest';
import { measurePdfScrollPosition } from './page-scroll-position.js';

function createPages(viewTop: number) {
  const scroller = document.createElement('div');
  scroller.getBoundingClientRect = () => DOMRect.fromRect({ y: viewTop, width: 100, height: 100 });
  const reads = Array.from({ length: 5 }, (_, index) =>
    vi.fn(() => DOMRect.fromRect({ y: index * 100, width: 100, height: 80 })),
  );
  const elements = new Map(
    reads.map((read, index) => {
      const page = document.createElement('div');
      page.getBoundingClientRect = read;
      return [index, page];
    }),
  );
  return { scroller, elements, reads };
}

describe('PDF page scroll position', () => {
  it('UIC-PDF-VIEWER-1.7 UIC-PDF-VIEWER-11.4 uses the same near page boxes for both positions', () => {
    const { scroller, elements, reads } = createPages(165);
    const position = measurePdfScrollPosition(scroller, elements, {
      nearPages: new Set([1, 2]),
      pageCount: elements.size,
    });

    expect(position.atTop?.pageIndex).toBe(1);
    expect(position.mostVisible?.pageIndex).toBe(2);
    expect(reads.map((read) => read.mock.calls.length)).toEqual([1, 1, 1, 1, 0]);
  });

  it('UIC-PDF-VIEWER-1.7 UIC-PDF-VIEWER-11.4 finds the right pages before the observer catches up', () => {
    const { scroller, elements, reads } = createPages(280);
    const position = measurePdfScrollPosition(scroller, elements, {
      nearPages: new Set([0, 1]),
      pageCount: elements.size,
    });

    expect(position.atTop?.pageIndex).toBe(3);
    expect(position.mostVisible?.pageIndex).toBe(3);
    expect(reads.map((read) => read.mock.calls.length)).toEqual([0, 0, 1, 1, 1]);
  });

  it('UIC-PDF-VIEWER-3.3 UIC-PDF-VIEWER-11.4 finds pages without an observer, including in gaps', () => {
    const { scroller, elements } = createPages(80);
    const position = measurePdfScrollPosition(scroller, elements, {
      nearPages: null,
      pageCount: elements.size,
    });

    expect(position.atTop?.pageIndex).toBe(1);
    expect(position.mostVisible?.pageIndex).toBe(1);
  });
});
