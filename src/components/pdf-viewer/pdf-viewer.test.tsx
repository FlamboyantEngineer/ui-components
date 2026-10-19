import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  createEngine,
  createTextContent,
  pointsToPixels,
  renderReady,
  renderViewer,
  sampleLines,
  searchStatus as status,
  stubIntersectionObserver,
  stubLayout,
  type TestLink,
} from '../../../test/pdf-fixtures.js';
import { ProjectionOutlet, ProjectionProvider } from '../projection/projection.js';
import { PdfViewer } from './pdf-viewer.js';

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

  it('UIC-PDF-VIEWER-2.1 sizes pages to the zoom and draws them with their annotations', async () => {
    const { container, engine } = await renderReady({ defaultZoom: 100 });
    const page = container.querySelector<HTMLElement>('.ui-pdf-viewer__page');
    expect(page?.style.width).toBe(`${420 * pointsToPixels}px`);
    const canvas = page?.querySelector('canvas');
    expect(canvas).toHaveClass('ui-pdf-viewer__canvas');
    expect(canvas).toHaveAttribute('width', '560');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(engine.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas, annotationMode: 1, transform: undefined }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(Number.parseFloat(page?.style.width ?? '')).toBeCloseTo(420 * 1.25 * pointsToPixels);
    await waitFor(() => expect(engine.render).toHaveBeenCalledTimes(6));
  });

  it('UIC-PDF-VIEWER-2.5 leaves annotations and links out while they are switched off', async () => {
    const links: Record<number, TestLink[]> = {
      0: [{ rect: [46, 388, 202, 404], url: 'https://example.com/' }],
    };
    const engine = createEngine({ links });
    const { container, update } = await renderReady({ showAnnotations: false }, engine);
    const canvas = container.querySelector('canvas');
    expect(engine.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas, annotationMode: 0 }),
    );
    expect(engine.render).not.toHaveBeenCalledWith(expect.objectContaining({ annotationMode: 1 }));
    expect(engine.AnnotationLayer).not.toHaveBeenCalled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[role="presentation"]').length).toBeGreaterThan(0);

    update({ showAnnotations: true });
    expect(await screen.findByRole('link', { name: 'https://example.com/' })).toBeInTheDocument();
    expect(engine.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas, annotationMode: 1 }),
    );
    update({ showAnnotations: false });
    await waitFor(() => expect(screen.queryByRole('link')).not.toBeInTheDocument());
  });

  it('UIC-PDF-VIEWER-2.1 renders only the pages near the view', async () => {
    const observer = stubIntersectionObserver();
    const { container, engine } = renderViewer();
    await waitFor(() => expect(observer.observed).toHaveLength(3));
    expect(engine.render).not.toHaveBeenCalled();
    act(() => observer.report([1], true));
    await waitFor(() => expect(engine.render).toHaveBeenCalledTimes(1));
    const canvases = container.querySelectorAll('canvas');
    expect(canvases[0]).toHaveAttribute('width', '0');
    expect(canvases[1]).not.toHaveAttribute('width', '0');
    act(() => observer.report([1], false));
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
    stubLayout();
    const { container } = await renderReady({ defaultZoom: 100 });
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
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['match', 'group'] });
    expect(field.closest('.ui-pdf-viewer__group')).toHaveClass('ui-find-bar');
    expectHooksMatchSpec(container, 'FIND-BAR', { slots: ['query', 'status', 'options'] });

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
    await renderReady({
      actions: <button onClick={download}>Download</button>,
      leadingActions: <button>Outline</button>,
      renderPageOverlay: () => null,
      defaultSidebarOpen: true,
    });
    const toolbar = screen.getByRole('toolbar', { name: 'Report controls' });
    const controls = [...toolbar.querySelectorAll('button:not([hidden]), input')].map(
      (control) => control.getAttribute('aria-label') ?? control.textContent,
    );
    expect(controls[0]).toBe('Outline');
    expect(controls[1]).toBe('Sidebar');
    expect(screen.getByRole('button', { name: 'Outline' }).parentElement).toHaveClass(
      'ui-pdf-viewer__leading-actions',
    );
    expect(controls.indexOf('Zoom level')).toBeLessThan(controls.indexOf('Fit page width'));
    expect(controls.indexOf('Fit whole page')).toBeLessThan(controls.indexOf('Previous page'));
    expect(controls.indexOf('Next page')).toBeLessThan(controls.indexOf('Find in document'));
    expect(controls.indexOf('Find options')).toBeLessThan(controls.indexOf('More options'));
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

    // The password form and the outline show in viewers of their own.
    const outline = [{ title: 'Markets', dest: 'markets', url: null, items: [] }];
    render(
      <>
        <PdfViewer
          aria-label="Locked"
          source="/files/Locked.pdf"
          loadEngine={createEngine({ password: 'orchard' }).loadEngine}
        />
        <PdfViewer
          aria-label="Outlined"
          source="/files/Report.pdf"
          loadEngine={createEngine({ outline }).loadEngine}
          defaultSidebarOpen
        />
      </>,
    );
    await screen.findByLabelText('Password');
    await screen.findByRole('treegrid', { name: 'Outline' });
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

  it('UIC-PDF-VIEWER-6.3 renders the toolbar at a projection outlet', async () => {
    const engine = createEngine();
    const viewer = (
      <PdfViewer aria-label="Report" source="/files/Report.pdf" loadEngine={engine.loadEngine} />
    );
    const { container, unmount } = render(
      <ProjectionProvider>
        <header aria-label="Band">
          <ProjectionOutlet slot="document-tools" />
        </header>
        <PdfViewer
          aria-label="Report"
          source="/files/Report.pdf"
          loadEngine={engine.loadEngine}
          toolbarSlot="document-tools"
          defaultZoom={100}
        />
      </ProjectionProvider>,
    );
    const band = screen.getByRole('banner', { name: 'Band' });
    const toolbar = await within(band).findByRole('toolbar', { name: 'Report controls' });
    expect(container.querySelector('.ui-pdf-viewer .ui-pdf-viewer__toolbar')).toBeNull();
    await waitFor(() => expect(within(toolbar).getByRole('slider')).toBeEnabled());
    await userEvent.click(within(toolbar).getByRole('button', { name: 'Zoom in' }));
    const page = container.querySelector<HTMLElement>('.ui-pdf-viewer__page');
    expect(Number.parseFloat(page?.style.width ?? '')).toBeCloseTo(420 * 1.25 * pointsToPixels);
    unmount();

    const view = render(<PdfViewer {...viewer.props} toolbarSlot="document-tools" />);
    expect(view.container.querySelector('.ui-pdf-viewer > .ui-pdf-viewer__toolbar')).not.toBeNull();
  });

  it('UIC-PDF-VIEWER-7.1 draws caller content over each page with its viewport', async () => {
    const renderPageOverlay = vi.fn(({ pageIndex, viewport }) => (
      <span title={`Mark ${pageIndex}`}>{`${viewport.width} at ${viewport.scale}`}</span>
    ));
    const { container } = await renderReady({ defaultZoom: 75, renderPageOverlay });
    const overlays = container.querySelectorAll<HTMLElement>('.ui-pdf-viewer__overlay');
    expect(overlays).toHaveLength(3);
    const first = overlays[0]!;
    expect(first.parentElement).toHaveClass('ui-pdf-viewer__page');
    expect(first.previousElementSibling).toHaveClass('ui-pdf-viewer__annotation-layer');
    expect(first.previousElementSibling?.previousElementSibling).toHaveClass(
      'ui-pdf-viewer__text-layer',
    );
    expect(first.style).toMatchObject({
      position: 'absolute',
      inset: '0px',
      pointerEvents: 'none',
    });
    expect(within(first).getByTitle('Mark 0')).toHaveTextContent('420 at 1');
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['overlay'] });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByTitle('Mark 2')).toHaveTextContent(
      `${420 * pointsToPixels} at ${pointsToPixels}`,
    );
  });

  it('UIC-PDF-VIEWER-7.1 draws overlays only over the pages that render', async () => {
    const observer = stubIntersectionObserver();
    const { container } = renderViewer({ renderPageOverlay: () => <span>Mark</span> });
    await waitFor(() => expect(observer.observed).toHaveLength(3));
    expect(container.querySelectorAll('.ui-pdf-viewer__overlay')).toHaveLength(0);
    act(() => observer.report([2], true));
    const overlays = container.querySelectorAll('.ui-pdf-viewer__overlay');
    expect(overlays).toHaveLength(1);
    expect(overlays[0]?.closest('.ui-pdf-viewer__page')).toBe(observer.observed[2]);
  });
});
