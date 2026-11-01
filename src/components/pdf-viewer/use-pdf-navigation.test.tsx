import { act, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEngine,
  holdDestinations,
  pointsToPixels,
  renderReady,
  renderViewer,
  stubIntersectionObserver,
  stubLayout,
} from '../../../test/pdf-fixtures.js';
import type { PdfDocumentParams, PdfViewport } from './pdf-engine.js';

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

  it('UIC-PDF-VIEWER-4.3 opens each new document at the caller page, without reporting another', async () => {
    stubLayout();
    const onPageChange = vi.fn();
    const { engine } = createEngine();
    const short = createEngine({ lines: [['Markets'], ['Harvest']] });
    // The two-page document opens from its own engine's copy.
    const loadEngine = async () => ({
      ...engine,
      getDocument: (params: PdfDocumentParams) =>
        'url' in params && params.url === '/files/Short.pdf'
          ? short.engine.getDocument(params)
          : engine.getDocument(params),
    });
    const view = renderViewer({ defaultZoom: 100, page: 2, onPageChange, loadEngine });
    await waitFor(() => expect(pageField()).toHaveValue('3'));
    for (const source of ['/files/B.pdf', '/files/A.pdf', '/files/B.pdf'] as const) {
      view.update({ defaultZoom: 100, page: 2, onPageChange, loadEngine, source });
      await waitFor(() => expect(scroller().scrollTop).toBe(0));
      await waitFor(() => expect(pageField()).toHaveValue('3'));
      expect(scroller().scrollTop).toBe(1600);
    }
    // A shorter document opens at its last page.
    view.update({
      defaultZoom: 100,
      page: 2,
      onPageChange,
      loadEngine,
      source: '/files/Short.pdf',
    });
    await waitFor(() => expect(pageField()).toHaveValue('2'));
    // Only the shorter document's page differs from the caller's; no first page shows in between.
    expect(onPageChange.mock.calls).toEqual([[1]]);
  });

  it('UIC-PDF-VIEWER-4.3 serves a page requested while the next document loads, once it is shown', async () => {
    const view = await renderReady({ defaultZoom: 100, page: 0 });
    view.update({ defaultZoom: 100, page: 0, source: null });
    view.update({ defaultZoom: 100, page: 1, source: null });
    view.update({ defaultZoom: 100, page: 1, source: '/files/Other.pdf' });
    await waitFor(() => expect(screen.getAllByRole('presentation').length).toBeGreaterThan(0));
    // Hidden, the viewer keeps the request until it is shown.
    expect(scroller().scrollTop).toBe(0);
    stubLayout();
    view.update({ defaultZoom: 100, page: 1, source: '/files/Other.pdf', revealRect: null });
    expect(scroller().scrollTop).toBe(800);
    expect(pageField()).toHaveValue('2');
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

  it('UIC-PDF-VIEWER-7.3 reveals the same rectangle in each new document, before the caller page', async () => {
    stubLayout();
    const rect = { pageIndex: 1, left: 0, top: 150, width: 60, height: 15 };
    const view = await renderReady({ defaultZoom: 100, page: 2, revealRect: rect });
    expect(scroller().scrollTop).toBeCloseTo(800 + 150 * pointsToPixels);
    view.update({ defaultZoom: 100, page: 2, revealRect: rect, source: '/files/Other.pdf' });
    await waitFor(() => expect(scroller().scrollTop).toBe(0));
    await waitFor(() => expect(scroller().scrollTop).toBeCloseTo(800 + 150 * pointsToPixels));
    expect(pageField()).toHaveValue('2');
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

  it('UIC-PDF-VIEWER-4.5 goes to the latest destination when earlier lookups finish last', async () => {
    stubLayout();
    const engine = createEngine();
    const lookups = holdDestinations(engine);
    const view = await renderReady({ defaultZoom: 100, destination: 'markets' }, engine);
    view.update({ defaultZoom: 100, destination: 'varieties' });

    await lookups.settle('varieties', [{ num: 2, gen: 0 }, { name: 'Fit' }]);
    await waitFor(() => expect(scroller().scrollTop).toBe(1600));
    await lookups.settle('markets', [{ num: 1, gen: 0 }, { name: 'Fit' }]);
    expect(scroller().scrollTop).toBe(1600);
    expect(pageField()).toHaveValue('3');
  });

  it('UIC-PDF-VIEWER-4.5 drops a destination still being looked up once the reader goes to a page', async () => {
    stubLayout();
    const engine = createEngine();
    const lookups = holdDestinations(engine);
    await renderReady({ defaultZoom: 100, destination: 'markets' }, engine);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(scroller().scrollTop).toBe(800);
    await lookups.settle('markets', [{ num: 2, gen: 0 }, { name: 'Fit' }]);
    expect(scroller().scrollTop).toBe(800);
    expect(pageField()).toHaveValue('2');
  });

  it('UIC-PDF-VIEWER-4.5 drops a destination still being looked up once the caller sets the page', async () => {
    stubLayout();
    const engine = createEngine();
    const lookups = holdDestinations(engine);
    const view = await renderReady({ defaultZoom: 100, destination: 'pending' }, engine);
    view.update({ defaultZoom: 100, destination: 'pending', page: 2 });
    expect(pageField()).toHaveValue('3');
    await lookups.settle('pending', [{ num: 0, gen: 0 }, { name: 'Fit' }]);
    expect(pageField()).toHaveValue('3');
    expect(scroller().scrollTop).toBe(1600);
  });

  it('UIC-PDF-VIEWER-4.5 drops a destination still being looked up once it is cleared', async () => {
    stubLayout();
    const engine = createEngine();
    const lookups = holdDestinations(engine);
    const view = await renderReady({ defaultZoom: 100, destination: 'pending' }, engine);
    view.update({ defaultZoom: 100, destination: null });
    await lookups.settle('pending', [{ num: 2, gen: 0 }, { name: 'Fit' }]);
    expect(pageField()).toHaveValue('1');
    expect(scroller().scrollTop).toBe(0);
  });

  it('UIC-PDF-VIEWER-4.5 drops a destination still being looked up once find reveals a match', async () => {
    stubLayout();
    const engine = createEngine();
    const lookups = holdDestinations(engine);
    const view = await renderReady({ defaultZoom: 100, destination: 'pending' }, engine);
    view.update({ defaultZoom: 100, destination: 'pending', searchQuery: 'Varieties' });
    await waitFor(() =>
      expect(document.querySelector('.ui-pdf-viewer__match')).toBeInTheDocument(),
    );
    const revealed = scroller().scrollTop;
    await lookups.settle('pending', [{ num: 2, gen: 0 }, { name: 'Fit' }]);
    expect(scroller().scrollTop).toBe(revealed);
    expect(pageField()).not.toHaveValue('3');
  });

  it('UIC-PDF-VIEWER-4.5 still lands a destination looked up across a rotation', async () => {
    stubLayout();
    const engine = createEngine();
    const lookups = holdDestinations(engine);
    await renderReady({ defaultZoom: 100, destination: 'pending' }, engine);
    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rotate clockwise' }));
    await lookups.settle('pending', [{ num: 1, gen: 0 }, { name: 'Fit' }]);
    await waitFor(() => expect(pageField()).toHaveValue('2'));
  });
});
