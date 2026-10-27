import { act, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pageSize, pointsToPixels, renderReady } from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';

/** Pages sit 800 pixels apart after a 12 pixel inset, under a scroller at the top of the window. */
function stubPageBoxes() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const scroller = this.closest<HTMLElement>('.ui-pdf-viewer__scroller');
    if (this.classList.contains('ui-pdf-viewer__scroller'))
      return DOMRect.fromRect({ width: 600, height: 600 });
    if (!this.classList.contains('ui-pdf-viewer__page') || !this.parentElement || !scroller)
      return DOMRect.fromRect();
    const index = [...this.parentElement.children].indexOf(this);
    const height = pageSize.height * pointsToPixels;
    return DOMRect.fromRect({ y: 12 + index * 800 - scroller.scrollTop, width: 560, height });
  });
}

/** Frames run only when a test flushes them. */
function stubFrames() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 1;
  Object.assign(window, {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      callbacks.set(next, callback);
      return next++;
    },
    cancelAnimationFrame: (id: number) => callbacks.delete(id),
  });
  return () =>
    act(() => {
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback(0);
    });
}

describe('PdfViewer visible position', () => {
  let flushFrames: () => void;

  beforeEach(() => {
    stubPageBoxes();
    flushFrames = stubFrames();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UIC-PDF-VIEWER-11.4 reports the page and offset at the top edge as the reader scrolls', async () => {
    const onVisiblePositionChange = vi.fn();
    const { container } = await renderReady({ defaultZoom: 100, onVisiblePositionChange });
    flushFrames();
    expect(onVisiblePositionChange).toHaveBeenLastCalledWith({ pageIndex: 0, top: 0 });

    const scroller = requireDefined(
      container.querySelector<HTMLElement>('.ui-pdf-viewer__scroller'),
    );
    scroller.scrollTop = 1000;
    fireEvent.scroll(scroller);
    fireEvent.scroll(scroller);
    flushFrames();
    expect(onVisiblePositionChange).toHaveBeenLastCalledWith({
      pageIndex: 1,
      top: Math.round((188 / pointsToPixels) * 100) / 100,
    });
    const calls = onVisiblePositionChange.mock.calls.length;

    fireEvent.scroll(scroller);
    flushFrames();
    expect(onVisiblePositionChange).toHaveBeenCalledTimes(calls);

    // Between two pages, the edge belongs to the next one, at its top.
    scroller.scrollTop = 808;
    fireEvent.scroll(scroller);
    flushFrames();
    expect(onVisiblePositionChange).toHaveBeenLastCalledWith({ pageIndex: 1, top: 0 });
  });

  it('UIC-PDF-VIEWER-11.4 reports a new document even where the last one stood', async () => {
    const onVisiblePositionChange = vi.fn();
    const { update } = await renderReady({ onVisiblePositionChange });
    flushFrames();
    expect(onVisiblePositionChange).toHaveBeenCalledTimes(1);

    update({ onVisiblePositionChange, source: '/files/Other.pdf' });
    await waitFor(() => {
      flushFrames();
      expect(onVisiblePositionChange).toHaveBeenCalledTimes(2);
    });
    expect(onVisiblePositionChange).toHaveBeenLastCalledWith({ pageIndex: 0, top: 0 });
  });
});
