import { act, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEngine,
  pointsToPixels,
  renderReady,
  renderViewer,
  stubIntersectionObserver,
  stubLayout,
} from '../../../test/pdf-fixtures.js';
import type { PdfViewport } from './pdf-engine.js';

const scroller = () => screen.getByRole('document');
const pageField = () => screen.getByLabelText('Page');

describe('PdfViewer navigation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-4.3 goes to a requested page once and reports the page the reader is on', async () => {
    stubLayout();
    const onPageChange = vi.fn();
    const view = await renderReady({ defaultZoom: 100, page: 0, onPageChange });
    expect(onPageChange).not.toHaveBeenCalled();

    view.update({ defaultZoom: 100, page: 2, onPageChange });
    expect(scroller().scrollTop).toBe(1600);
    expect(pageField()).toHaveValue('3');
    expect(onPageChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange.mock.calls).toEqual([[1], [0]]);
    expect(scroller().scrollTop).toBe(0);

    // The caller catching up with earlier reports does not pull the reader back.
    view.update({ defaultZoom: 100, page: 1, onPageChange });
    view.update({ defaultZoom: 100, page: 0, onPageChange });
    expect(scroller().scrollTop).toBe(0);
    expect(pageField()).toHaveValue('1');

    view.update({ defaultZoom: 100, page: 1, onPageChange });
    expect(scroller().scrollTop).toBe(800);
    expect(pageField()).toHaveValue('2');
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('UIC-PDF-VIEWER-4.3 goes to a page requested before the document opens, within its pages', async () => {
    stubLayout();
    const onPageChange = vi.fn();
    const engine = createEngine();
    const view = renderViewer({ defaultZoom: 100, source: null, page: 9, onPageChange }, engine);
    view.update({ defaultZoom: 100, source: '/files/Report.pdf', page: 9, onPageChange });
    await waitFor(() => expect(pageField()).toHaveValue('3'));
    expect(scroller().scrollTop).toBe(1600);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('UIC-PDF-VIEWER-4.3 reports the first page once a document opens without a caller page', async () => {
    const onPageChange = vi.fn();
    await renderReady({ onPageChange });
    expect(onPageChange.mock.calls).toEqual([[0]]);
  });

  it('UIC-PDF-VIEWER-7.3 reveals a rectangle once per new value', async () => {
    stubLayout();
    const rect = { pageIndex: 1, left: 0, top: 150, width: 60, height: 15 };
    const view = await renderReady({ defaultZoom: 100, revealRect: rect });
    // The page lands where the first page sits, then the rectangle's top lands there.
    expect(scroller().scrollTop).toBeCloseTo(800 + 150 * pointsToPixels);
    expect(pageField()).toHaveValue('2');

    scroller().scrollTop = 0;
    view.update({ defaultZoom: 100, revealRect: { ...rect } });
    expect(scroller().scrollTop).toBe(0);
    view.update({ defaultZoom: 100, revealRect: null });
    view.update({ defaultZoom: 100, revealRect: { ...rect } });
    expect(scroller().scrollTop).toBeCloseTo(800 + 150 * pointsToPixels);

    view.update({ defaultZoom: 100, revealRect: { ...rect, pageIndex: 2, left: 600, top: 0 } });
    expect(scroller().scrollTop).toBe(1600);
    expect(scroller().scrollLeft).toBeCloseTo((600 + 30) * pointsToPixels - 300);
    expect(pageField()).toHaveValue('3');
  });

  it('UIC-PDF-VIEWER-7.3 waits until the viewer is shown', async () => {
    const view = await renderReady({ defaultZoom: 100 });
    view.update({
      defaultZoom: 100,
      revealRect: { pageIndex: 2, left: 0, top: 0, width: 1, height: 1 },
    });
    expect(scroller().scrollTop).toBe(0);
    stubLayout();
    view.update({
      defaultZoom: 100,
      revealRect: { pageIndex: 2, left: 0, top: 0, width: 1, height: 1 },
    });
    expect(scroller().scrollTop).toBe(1600);
  });

  it('UIC-PDF-VIEWER-7.2 reports the viewports of the pages that render', async () => {
    const observer = stubIntersectionObserver();
    const onPageViewports = vi.fn<(viewports: ReadonlyMap<number, PdfViewport>) => void>();
    renderViewer({ defaultZoom: 100, onPageViewports });
    expect(onPageViewports).toHaveBeenLastCalledWith(new Map());
    await waitFor(() => expect(observer.observed).toHaveLength(3));

    act(() => observer.report([0, 1], true));
    const reported = onPageViewports.mock.lastCall?.[0];
    expect([...(reported?.keys() ?? [])]).toEqual([0, 1]);
    expect(reported?.get(1)).toEqual({
      width: 420 * pointsToPixels,
      height: 595 * pointsToPixels,
      scale: pointsToPixels,
    });

    act(() => observer.report([0], false));
    expect([...(onPageViewports.mock.lastCall?.[0].keys() ?? [])]).toEqual([1]);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onPageViewports.mock.lastCall?.[0].get(1)?.scale).toBeCloseTo(1.25 * pointsToPixels);
  });

  it('UIC-PDF-VIEWER-4.4 opens a document at the default page, within its pages', async () => {
    stubLayout();
    const onPageChange = vi.fn();
    const view = renderViewer({ defaultZoom: 100, defaultPage: 1, onPageChange });
    await waitFor(() => expect(pageField()).toHaveValue('2'));
    expect(scroller().scrollTop).toBe(800);
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    view.update({ defaultZoom: 100, defaultPage: 7, source: new Uint8Array([1]), onPageChange });
    await waitFor(() => expect(pageField()).toHaveValue('3'));
    expect(scroller().scrollTop).toBe(1600);
  });

  it('UIC-PDF-VIEWER-4.5 goes to a named destination each time it changes', async () => {
    stubLayout();
    const engine = createEngine({
      destinations: {
        markets: [{ num: 2, gen: 0 }, { name: 'XYZ' }, null, 545, null],
        varieties: [{ num: 1, gen: 0 }, { name: 'Fit' }],
      },
    });
    const view = await renderReady({ defaultZoom: 100, destination: 'markets' }, engine);
    await waitFor(() => expect(pageField()).toHaveValue('3'));
    expect(scroller().scrollTop).toBeCloseTo(1600 + 50 * pointsToPixels);

    view.update({ defaultZoom: 100, destination: 'varieties' });
    await waitFor(() => expect(scroller().scrollTop).toBe(800));
    view.update({ defaultZoom: 100, destination: 'orchards' });
    await waitFor(() => expect(engine.pdf.getDestination).toHaveBeenLastCalledWith('orchards'));
    expect(scroller().scrollTop).toBe(800);
    expect(pageField()).toHaveValue('2');
  });
});
