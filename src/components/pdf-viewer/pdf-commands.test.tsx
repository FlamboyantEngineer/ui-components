import { act, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEngine, renderReady, renderViewer } from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toPdfFileName } from './pdf-commands.js';

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
    await chooseCommand('Download');
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('Report.pdf');
    expect(link.href).toBe('blob:page-1');
    expect(engine.pdf.getData).toHaveBeenCalled();
    // The file's address is released once the download has started.
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:page-1'), {
      timeout: 3000,
    });
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
