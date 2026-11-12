import { act, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  createEngine,
  renderReady,
  renderViewer,
  type TestEngine,
} from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toPdfFileName } from './pdf-commands.js';
import type { PdfRenderParams } from './pdf-engine.js';

async function chooseCommand(name: string) {
  await userEvent.click(screen.getByRole('button', { name: 'More options' }));
  await userEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name }));
}

describe('PdfViewer commands', () => {
  beforeEach(() => {
    let created = 0;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:page-${++created}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  it('UIC-PDF-VIEWER-9.1 offers the document commands once the document has opened', async () => {
    const engine = createEngine();
    const view = renderViewer({ source: null }, engine);
    expect(screen.getByRole('button', { name: 'More options' })).toBeDisabled();
    view.update({ source: '/files/Report.pdf' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'More options' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Rotate clockwise', 'Rotate counterclockwise', 'Print', 'Download']);
    expect(within(menu).getByRole('separator')).toBeInTheDocument();
  });

  it('UIC-PDF-VIEWER-9.4 names the saved file after the URL, or else after the viewer', () => {
    expect(toPdfFileName('/files/Seasonal%20report.pdf', 'Report')).toBe('Seasonal report.pdf');
    expect(toPdfFileName(new URL('https://example.com/a/Report.PDF?v=2'), 'Doc')).toBe(
      'Report.PDF',
    );
    expect(toPdfFileName('/files/report?id=4', 'Report')).toBe('Report.pdf');
    expect(toPdfFileName('/files/%E0%A4%A.pdf', 'Report')).toBe('Report.pdf');
    expect(toPdfFileName(new Uint8Array([1]), 'Report')).toBe('Report.pdf');
  });

  it('UIC-PDF-VIEWER-9.4 saves the document bytes', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const engine = createEngine();
    await renderReady({ source: new Uint8Array([1, 2]) }, engine);
    // Fake timers that still follow real time, so the address's lifetime can be skipped.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await chooseCommand('Download');
      await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
      const link = click.mock.contexts[0] as HTMLAnchorElement;
      expect(link.download).toBe('Report.pdf');
      expect(link.href).toBe('blob:page-1');
      expect(engine.pdf.getData).toHaveBeenCalled();
      // The file's address is released once the download has had time to start.
      expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:page-1');
      act(() => {
        vi.advanceTimersByTime(40_000);
      });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:page-1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-PDF-VIEWER-9.3 prints every page as an image in a hidden frame and removes it after', async () => {
    const blobs: Array<() => void> = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
      blobs.push(() => callback(new Blob(['png'])));
    });
    const engine = createEngine();
    await renderReady({}, engine);
    await chooseCommand('Print');
    await waitFor(() => expect(blobs).toHaveLength(1));
    const frame = requireDefined(document.querySelector('iframe'));
    expect(frame).toHaveAttribute('aria-hidden', 'true');
    expect(frame.style).toMatchObject({ position: 'fixed', visibility: 'hidden', width: '0px' });
    const frameWindow = requireDefined(frame.contentWindow);
    const print = vi.fn();
    frameWindow.print = print;
    for (let page = 0; page < 3; page += 1) {
      await waitFor(() => expect(blobs).toHaveLength(page + 1));
      act(() => blobs[page]?.());
    }
    const frameDocument = requireDefined(frame.contentDocument);
    await waitFor(() => expect(frameDocument.images).toHaveLength(3));
    expect(frameDocument.body).toBeNull();
    const image = requireDefined(frameDocument.images[0]);
    expect(image.src).toBe('blob:page-1');
    expect(image.parentElement?.style.height).toBe('100vh');
    expect(engine.render).toHaveBeenCalledWith(
      expect.objectContaining({ viewport: expect.objectContaining({ scale: 150 / 72 }) }),
    );
    expect(print).not.toHaveBeenCalled();
    for (const each of frameDocument.images) each.dispatchEvent(new Event('load'));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    frameWindow.dispatchEvent(new Event('afterprint'));
    expect(frame.isConnected).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  });

  it('UIC-PDF-VIEWER-2.5 prints the pages without their annotations when they are switched off', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(() => undefined);
    const engine = createEngine();
    await renderReady({ showAnnotations: false }, engine);
    await chooseCommand('Print');
    await waitFor(() =>
      expect(engine.render).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport: expect.objectContaining({ scale: 150 / 72 }),
          annotationMode: 0,
        }),
      ),
    );
    document.querySelector('iframe')?.remove();
  });
});

describe('PdfViewer print failures', () => {
  beforeEach(() => {
    let created = 0;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:page-${++created}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['png'])),
    );
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  /** Makes the printed renders of the pages settle as `settle` decides, page by page. */
  function holdPrintedPages(engine: TestEngine) {
    const tasks: Array<{ resolve: () => void; reject: (cause: Error) => void; cancel: Mock }> = [];
    const viewerRender = engine.render.getMockImplementation();
    engine.render.mockImplementation((params: PdfRenderParams) => {
      if (params.viewport.scale !== 150 / 72) return requireDefined(viewerRender)(params);
      const cancel = vi.fn();
      const promise = new Promise<void>((resolve, reject) => {
        tasks.push({ resolve: () => resolve(), reject, cancel });
      });
      return { promise, cancel };
    });
    return tasks;
  }

  it('UIC-PDF-VIEWER-9.3 releases the frame and the pages drawn so far when a later page fails', async () => {
    const onCommandError = vi.fn();
    const engine = createEngine();
    const tasks = holdPrintedPages(engine);
    await renderReady({ onCommandError }, engine);
    await chooseCommand('Print');
    await waitFor(() => expect(tasks).toHaveLength(1));
    expect(document.querySelector('iframe')).not.toBeNull();
    await act(async () => requireDefined(tasks[0]).resolve());
    await waitFor(() => expect(tasks).toHaveLength(2));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const failure = new Error('The page could not be drawn.');
    await act(async () => requireDefined(tasks[1]).reject(failure));
    await waitFor(() => expect(onCommandError).toHaveBeenCalledWith('print', failure));
    expect(document.querySelector('iframe')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:page-1');
  });

  it('UIC-PDF-VIEWER-9.3 reports a page that cannot be encoded', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => callback(null));
    const onCommandError = vi.fn();
    await renderReady({ onCommandError });
    await chooseCommand('Print');
    await waitFor(() => expect(onCommandError).toHaveBeenCalledWith('print', expect.any(Error)));
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('UIC-PDF-VIEWER-9.3 cancels a pending print when the viewer unmounts, without a failure', async () => {
    const onCommandError = vi.fn();
    const engine = createEngine();
    const tasks = holdPrintedPages(engine);
    const view = await renderReady({ onCommandError }, engine);
    await chooseCommand('Print');
    await waitFor(() => expect(tasks).toHaveLength(1));
    await act(async () => requireDefined(tasks[0]).resolve());
    await waitFor(() => expect(tasks).toHaveLength(2));
    view.unmount();
    expect(requireDefined(tasks[1]).cancel).toHaveBeenCalled();
    expect(document.querySelector('iframe')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:page-1');
    await act(async () => requireDefined(tasks[1]).reject(new Error('Rendering cancelled.')));
    expect(onCommandError).not.toHaveBeenCalled();
  });

  it('UIC-PDF-VIEWER-9.3 cancels a pending print when another document opens', async () => {
    const engine = createEngine();
    const tasks = holdPrintedPages(engine);
    const view = await renderReady({}, engine);
    await chooseCommand('Print');
    await waitFor(() => expect(tasks).toHaveLength(1));
    view.update({ source: '/files/Other.pdf' });
    await waitFor(() => expect(requireDefined(tasks[0]).cancel).toHaveBeenCalled());
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('UIC-PDF-VIEWER-9.4 reports a save that fails', async () => {
    const onCommandError = vi.fn();
    const engine = createEngine();
    const failure = new Error('The file could not be read.');
    engine.pdf.getData.mockRejectedValue(failure);
    await renderReady({ onCommandError }, engine);
    await chooseCommand('Download');
    await waitFor(() => expect(onCommandError).toHaveBeenCalledWith('download', failure));
  });
});
