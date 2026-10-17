import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  isTextItem,
  type PdfDocumentParams,
  type PdfEngine,
  type PdfTextContent,
  type PdfTextLayer,
  type PdfTextLayerOptions,
} from './pdf-engine.js';
import { PdfViewer, type PdfViewerProps } from './pdf-viewer.js';

const sampleLines = [
  ['Seasonal Report', 'The apple harvest began', 'and the pear harvest followed.'],
  ['Varieties', 'Pear: a short harvest window.'],
  ['Markets', 'Next year the harvest grows.'],
];

const pointsToPixels = 96 / 72;

function createTextContent(lines: readonly string[]): PdfTextContent {
  return { items: lines.map((str) => ({ str, hasEOL: true })) };
}

function createTextLayer({ textContentSource, container }: PdfTextLayerOptions): PdfTextLayer {
  const texts = textContentSource.items.filter(isTextItem).map((item) => item.str);
  const runs = texts.map((text) => {
    const run = document.createElement('span');
    run.setAttribute('role', 'presentation');
    run.textContent = text;
    return run;
  });
  return {
    textDivs: runs,
    textContentItemsStr: texts,
    render: async () => container.append(...runs),
    cancel: vi.fn(),
  };
}

function createEngine({
  lines = sampleLines,
  failure,
}: { lines?: string[][]; failure?: Error } = {}) {
  const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
  const pages = lines.map((pageLines) => ({
    getViewport: ({ scale }: { scale: number }) => ({
      width: 420 * scale,
      height: 595 * scale,
      scale,
    }),
    render,
    getTextContent: vi.fn(async () => createTextContent(pageLines)),
  }));
  const pdf = {
    numPages: pages.length,
    getPage: async (pageNumber: number) => pages[pageNumber - 1]!,
  };
  const destroy = vi.fn(async () => undefined);
  const getDocument = vi.fn((_params: PdfDocumentParams) => ({
    promise: failure ? Promise.reject(failure) : Promise.resolve(pdf),
    destroy,
  }));
  const TextLayer = vi.fn(function (options: PdfTextLayerOptions) {
    return createTextLayer(options);
  });
  const engine: PdfEngine = {
    getDocument,
    GlobalWorkerOptions: { workerSrc: '' },
    TextLayer: TextLayer as unknown as PdfEngine['TextLayer'],
    AnnotationMode: { DISABLE: 0 },
  };
  return { engine, render, getDocument, destroy, TextLayer, loadEngine: vi.fn(async () => engine) };
}

function renderViewer(
  props: Partial<PdfViewerProps> = {},
  engine: ReturnType<typeof createEngine> = createEngine(),
) {
  const view = render(
    <PdfViewer
      aria-label="Report"
      source="/files/Report.pdf"
      loadEngine={engine.loadEngine}
      {...props}
    />,
  );
  return { ...view, engine, root: view.container.firstElementChild as HTMLElement };
}

async function renderReady(props: Partial<PdfViewerProps> = {}) {
  const view = renderViewer(props);
  await waitFor(() =>
    expect(view.container.querySelectorAll('[role="presentation"]')).toHaveLength(7),
  );
  return view;
}

const status = () => document.querySelector('.ui-pdf-viewer__search-status');

describe('PdfViewer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-1.1 opens the source through the injected engine and draws its pages', async () => {
    const { container, engine } = await renderReady();
    expect(engine.loadEngine).toHaveBeenCalledTimes(1);
    expect(engine.getDocument).toHaveBeenCalledWith({ url: '/files/Report.pdf' });
    expect(container.querySelectorAll('.ui-pdf-viewer__page')).toHaveLength(3);
  });

  it('UIC-PDF-VIEWER-1.1 opens bytes from a copy and destroys a replaced or unmounted document', async () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    const { engine, rerender, unmount } = renderViewer({ source: bytes });
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(1));
    const params = engine.getDocument.mock.calls[0]?.[0];
    expect(params && 'data' in params && params.data).not.toBe(bytes);
    expect(params && 'data' in params && [...params.data]).toEqual([37, 80, 68, 70]);

    rerender(<PdfViewer source={new Uint8Array(bytes)} loadEngine={engine.loadEngine} />);
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(2));
    expect(engine.destroy).toHaveBeenCalledTimes(1);
    unmount();
    expect(engine.destroy).toHaveBeenCalledTimes(2);
  });

  it('UIC-PDF-VIEWER-1.2 sets the worker before opening the document', async () => {
    const { engine } = renderViewer({ workerSrc: '/vendor/pdf.worker.mjs' });
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalled());
    expect(engine.engine.GlobalWorkerOptions.workerSrc).toBe('/vendor/pdf.worker.mjs');
  });

  it('UIC-PDF-VIEWER-1.3 stays loading, busy and disabled while the source is pending', async () => {
    const { root, engine, container, rerender } = renderViewer({ source: null });
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.ui-pdf-viewer__stage .ui-loading-overlay')).not.toBeNull();
    expect(screen.getByRole('slider', { name: 'Zoom level' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fit page width' })).toBeDisabled();
    expect(screen.getByLabelText('Page')).toBeDisabled();
    expect(engine.loadEngine).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['toolbar', 'stage', 'scroller'] });

    rerender(<PdfViewer source="/files/Report.pdf" loadEngine={engine.loadEngine} />);
    await waitFor(() => expect(root).not.toHaveAttribute('data-loading'));
    expect(root).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.ui-loading-overlay')).toBeNull();
  });

  it('UIC-PDF-VIEWER-1.4 shows the error, reports it and retries', async () => {
    const failure = new Error('Invalid PDF structure.');
    const onError = vi.fn();
    const engine = createEngine({ failure });
    const { root } = renderViewer({ onError }, engine);
    expect(await screen.findByRole('alert')).toHaveTextContent('The document could not be opened.');
    expect(root).toHaveAttribute('data-error', 'true');
    expect(onError).toHaveBeenCalledWith(failure);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(2));
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('UIC-PDF-VIEWER-2.1 sizes pages to the zoom and draws them without annotations', async () => {
    const { container, engine } = await renderReady({ defaultZoom: 100 });
    const page = container.querySelector<HTMLElement>('.ui-pdf-viewer__page');
    expect(page?.style.width).toBe(`${420 * pointsToPixels}px`);
    const canvas = page?.querySelector('canvas');
    expect(canvas).toHaveClass('ui-pdf-viewer__canvas');
    expect(canvas).toHaveAttribute('width', '560');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(engine.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas, annotationMode: 0, transform: undefined }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(Number.parseFloat(page?.style.width ?? '')).toBeCloseTo(420 * 1.25 * pointsToPixels);
    await waitFor(() => expect(engine.render).toHaveBeenCalledTimes(6));
  });

  it('UIC-PDF-VIEWER-2.1 renders only the pages near the view', async () => {
    const observers: Array<(entries: Array<Partial<IntersectionObserverEntry>>) => void> = [];
    const observed: Element[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (callback: (entries: Array<Partial<IntersectionObserverEntry>>) => void) {
        observers.push(callback);
        return {
          observe: (element: Element) => observed.push(element),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      }),
    );
    const { container, engine } = renderViewer();
    await waitFor(() => expect(observed).toHaveLength(3));
    expect(engine.render).not.toHaveBeenCalled();
    act(() => observers[0]?.([{ target: observed[1]!, isIntersecting: true }]));
    await waitFor(() => expect(engine.render).toHaveBeenCalledTimes(1));
    const canvases = container.querySelectorAll('canvas');
    expect(canvases[0]).toHaveAttribute('width', '0');
    expect(canvases[1]).not.toHaveAttribute('width', '0');
    act(() => observers[0]?.([{ target: observed[1]!, isIntersecting: false }]));
    expect(canvases[1]).toHaveAttribute('width', '0');
    expect(container.querySelectorAll('[role="presentation"]')).toHaveLength(0);
  });

  it('UIC-PDF-VIEWER-2.2 builds the text layer from the page text and publishes the scale', async () => {
    const { container, engine, root } = await renderReady({ defaultZoom: 150 });
    const layer = container.querySelector('.ui-pdf-viewer__text-layer');
    expect(engine.TextLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        container: layer,
        textContentSource: createTextContent(sampleLines[0]!),
        viewport: expect.objectContaining({ scale: 2 }),
      }),
    );
    expect(within(layer as HTMLElement).getByText('The apple harvest began')).toBeInTheDocument();
    expect(root.style.getPropertyValue('--ui-pdf-viewer-scale')).toBe('2');
  });

  it('UIC-PDF-VIEWER-2.3 scrolls the pages in a focusable document named after the viewer', async () => {
    renderViewer({ 'aria-label': undefined });
    const scroller = screen.getByRole('document', { name: 'Document' });
    expect(scroller).toHaveClass('ui-pdf-viewer__scroller');
    expect(scroller).toHaveAttribute('tabindex', '0');
  });

  it('UIC-PDF-VIEWER-3.1 steps the zoom along the grid and reports the applied zoom', async () => {
    const onZoomChange = vi.fn();
    const { container } = await renderReady({ defaultZoom: 137.4, onZoomChange });
    expect(container.querySelector('.ui-zoom-control__value')).toHaveTextContent('137%');
    expect(onZoomChange).toHaveBeenLastCalledWith(137.4);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(150);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
  });

  it('UIC-PDF-VIEWER-3.2 presses the fit mode that applies', async () => {
    await renderReady();
    const fitWidth = screen.getByRole('button', { name: 'Fit page width' });
    const fitPage = screen.getByRole('button', { name: 'Fit whole page' });
    expect(fitWidth).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(fitPage);
    expect(fitPage).toHaveAttribute('aria-pressed', 'true');
    expect(fitWidth).not.toHaveAttribute('aria-pressed');
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(fitPage).not.toHaveAttribute('aria-pressed');
  });

  it('UIC-PDF-VIEWER-3.4 zooms with Ctrl and the wheel instead of the page', async () => {
    const onZoomChange = vi.fn();
    await renderReady({ defaultZoom: 100, onZoomChange });
    const scroller = screen.getByRole('document');
    expect(fireEvent.wheel(scroller, { deltaY: -40 })).toBe(true);
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
    expect(fireEvent.wheel(scroller, { deltaY: -40, ctrlKey: true })).toBe(false);
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    fireEvent.wheel(scroller, { deltaY: 40, metaKey: true });
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
  });

  it('UIC-PDF-VIEWER-4.1 UIC-PDF-VIEWER-4.2 shows the page and goes to other pages', async () => {
    const { container } = await renderReady();
    const pages = container.querySelectorAll<HTMLElement>('.ui-pdf-viewer__page');
    pages.forEach((page, index) =>
      Object.defineProperty(page, 'offsetTop', { value: 12 + index * 800 }),
    );
    const scroller = screen.getByRole('document');
    const field = screen.getByLabelText('Page');
    expect(field).toHaveValue('1');
    expect(container.querySelector('.ui-pdf-viewer__page-total')).toHaveTextContent('of 3');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(scroller.scrollTop).toBe(800);
    expect(field).toHaveValue('2');
    await userEvent.clear(field);
    await userEvent.type(field, '9{Enter}');
    expect(field).toHaveValue('3');
    expect(scroller.scrollTop).toBe(1600);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('UIC-PDF-VIEWER-5.1 UIC-PDF-VIEWER-5.2 highlights every match and counts them', async () => {
    const { container } = await renderReady();
    const field = screen.getByRole('searchbox', { name: 'Find in document' });
    await userEvent.type(field, 'HARVEST');
    expect(status()).toHaveTextContent('1 of 4');
    const matches = container.querySelectorAll('.ui-pdf-viewer__match');
    expect([...matches].map((match) => match.textContent)).toEqual(Array(4).fill('harvest'));
    expect(matches[0]).toHaveAttribute('data-current', 'true');
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['match', 'search-status'] });

    await userEvent.clear(field);
    await userEvent.type(field, 'pear harvest');
    expect(status()).toHaveTextContent('1 of 1');
    await userEvent.clear(field);
    await userEvent.type(field, 'quince');
    expect(status()).toHaveTextContent('No results');
    await userEvent.keyboard('{Escape}');
    expect(field).toHaveValue('');
    expect(status()).toHaveTextContent('');
    expect(container.querySelectorAll('.ui-pdf-viewer__match')).toHaveLength(0);
  });

  it('UIC-PDF-VIEWER-5.2 runs a query typed while the document loads', async () => {
    const engine = createEngine();
    const { rerender } = renderViewer({ source: null }, engine);
    await userEvent.type(screen.getByRole('searchbox'), 'harvest');
    expect(status()).toHaveTextContent('Searching…');
    rerender(<PdfViewer source="/files/Report.pdf" loadEngine={engine.loadEngine} />);
    await waitFor(() => expect(status()).toHaveTextContent('1 of 4'));
  });

  it('UIC-PDF-VIEWER-5.3 steps through matches with the buttons and Enter, wrapping', async () => {
    const { container } = await renderReady();
    const next = screen.getByRole('button', { name: 'Next match' });
    const previous = screen.getByRole('button', { name: 'Previous match' });
    expect(next).toBeDisabled();
    const field = screen.getByRole('searchbox');
    await userEvent.type(field, 'harvest{Enter}');
    expect(status()).toHaveTextContent('2 of 4');
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    expect(status()).toHaveTextContent('1 of 4');
    await userEvent.click(previous);
    expect(status()).toHaveTextContent('4 of 4');
    const current = container.querySelector('.ui-pdf-viewer__match[data-current]');
    expect(current?.closest('.ui-pdf-viewer__page')).toBe(
      container.querySelectorAll('.ui-pdf-viewer__page')[2],
    );
    await userEvent.click(next);
    expect(status()).toHaveTextContent('1 of 4');
  });

  it('UIC-PDF-VIEWER-6.1 orders the toolbar and keeps caret keys in its text fields', async () => {
    const download = vi.fn();
    await renderReady({ actions: <button onClick={download}>Download</button> });
    const toolbar = screen.getByRole('toolbar', { name: 'Report controls' });
    const controls = [...toolbar.querySelectorAll('button:not([hidden]), input')].map(
      (control) => control.getAttribute('aria-label') ?? control.textContent,
    );
    expect(controls.indexOf('Zoom level')).toBeLessThan(controls.indexOf('Fit page width'));
    expect(controls.indexOf('Fit whole page')).toBeLessThan(controls.indexOf('Previous page'));
    expect(controls.indexOf('Next page')).toBeLessThan(controls.indexOf('Find in document'));
    expect(controls.at(-1)).toBe('Download');

    const field = screen.getByRole('searchbox');
    await userEvent.type(field, 'pear');
    await userEvent.keyboard('{ArrowLeft}');
    expect(field).toHaveFocus();
    expect((field as HTMLInputElement).selectionStart).toBe(3);
    await userEvent.keyboard('{Home}{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(download).toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'PDF-VIEWER', { slots: 'all' });
  });

  it('UIC-PDF-VIEWER-6.2 appends the caller class and forwards id and data attributes', async () => {
    const { root, container } = await renderReady({
      className: 'reader',
      id: 'report',
      'data-testid': 'viewer',
    });
    expect(root).toHaveClass('ui-pdf-viewer', 'reader');
    expect(root).toHaveAttribute('id', 'report');
    expect(root).toHaveAttribute('data-testid', 'viewer');
    expectHooksMatchSpec(container, 'PDF-VIEWER', {
      slots: ['toolbar', 'group', 'page-field', 'page', 'canvas', 'text-layer'],
    });
  });
});
