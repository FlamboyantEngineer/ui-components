import { act, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEngine,
  renderReady,
  renderViewer,
  stubIntersectionObserver,
  type TestEngine,
} from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { PdfRenderParams } from './pdf-engine.js';

/** The zero-based index of the page whose canvas a drawing targets. */
function pageIndexOf({ canvas }: PdfRenderParams): number {
  const page = canvas?.closest('.ui-pdf-viewer__page');
  return page ? [...document.querySelectorAll('.ui-pdf-viewer__page')].indexOf(page) : -1;
}

/** Makes the drawings of `pageIndex` reject with `failure` until `times` have failed. */
function failPage(engine: TestEngine, pageIndex: number, failure: Error, times = 1) {
  let left = times;
  engine.render.mockImplementation((params: PdfRenderParams) => {
    if (pageIndexOf(params) !== pageIndex || left === 0) {
      return { promise: Promise.resolve(), cancel: vi.fn() };
    }
    left -= 1;
    return { promise: Promise.reject(failure), cancel: vi.fn() };
  });
}

function pageElement(pageIndex: number): HTMLElement {
  return requireDefined(document.querySelectorAll<HTMLElement>('.ui-pdf-viewer__page')[pageIndex]);
}

describe('PdfViewer page failures', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-2.6 shows a page that fails to draw with a retry, keeps the others and reports it', async () => {
    const onPageError = vi.fn();
    const engine = createEngine();
    const failure = new Error('The page content is not supported.');
    failPage(engine, 1, failure);
    await renderReady({ onPageError }, engine);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Page 2 could not be drawn.');
    expect(pageElement(1)).toContainElement(alert);
    expect(pageElement(1)).toHaveAttribute('data-error', 'true');
    expect(pageElement(0)).not.toHaveAttribute('data-error');
    expect(onPageError).toHaveBeenCalledTimes(1);
    expect(onPageError).toHaveBeenCalledWith(1, failure);
    // The document stays readable: the page navigation still moves.
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('textbox', { name: 'Page' })).toHaveValue('2');
    const drawings = engine.render.mock.calls.length;
    await userEvent.click(
      within(alert.parentElement as HTMLElement).getByRole('button', { name: 'Retry' }),
    );
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(engine.render.mock.calls.length).toBeGreaterThan(drawings);
    expect(pageElement(1)).not.toHaveAttribute('data-error');
    expect(onPageError).toHaveBeenCalledTimes(1);
  });

  it('UIC-PDF-VIEWER-2.6 shows the failure of a page reached by scrolling', async () => {
    const observer = stubIntersectionObserver();
    const onPageError = vi.fn();
    const engine = createEngine();
    failPage(engine, 2, new Error('The page resources are missing.'));
    renderViewer({ onPageError }, engine);
    await waitFor(() => expect(observer.observed).toHaveLength(3));
    act(() => observer.report([0], true));
    await waitFor(() => expect(engine.render).toHaveBeenCalledTimes(1));
    // Role queries scoped to the page: a whole-viewer query is slow enough under load to time out.
    const page = within(pageElement(2));
    expect(page.queryByRole('alert')).not.toBeInTheDocument();
    act(() => observer.report([2], true));
    expect(await page.findByRole('alert')).toHaveTextContent('Page 3 could not be drawn.');
    expect(onPageError).toHaveBeenCalledWith(2, expect.any(Error));
    // Scrolled away, the page releases its drawing and its failure; back, it draws again.
    act(() => observer.report([2], false));
    expect(page.queryByRole('alert')).not.toBeInTheDocument();
    act(() => observer.report([2], true));
    await waitFor(() => expect(engine.render).toHaveBeenCalledTimes(3));
    expect(page.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('UIC-PDF-VIEWER-2.6 does not treat a cancelled drawing as a failure', async () => {
    const onPageError = vi.fn();
    const engine = createEngine();
    engine.render.mockImplementation(() => {
      let reject: (cause: Error) => void = () => undefined;
      const promise = new Promise<void>((_, fail) => {
        reject = fail;
      });
      return { promise, cancel: vi.fn(() => reject(new Error('Rendering cancelled'))) };
    });
    const view = renderViewer({ onPageError, defaultZoom: 100 }, engine);
    await waitFor(() => expect(engine.render).toHaveBeenCalled());
    view.update({ defaultZoom: 100, source: '/files/Other.pdf' });
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(2));
    view.unmount();
    await Promise.resolve();
    expect(onPageError).not.toHaveBeenCalled();
  });
});
