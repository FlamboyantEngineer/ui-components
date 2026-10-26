import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createEngine, pageSize, pointsToPixels, renderReady } from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { PdfViewer } from './pdf-viewer.js';
import { rotatePdf } from './use-pdf-rotation.js';
import type { LoadedPdf } from './use-pdf-document.js';

async function chooseCommand(name: string) {
  await userEvent.click(screen.getByRole('button', { name: 'More options' }));
  await userEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name }));
}

describe('PdfViewer rotation', () => {
  it('UIC-PDF-VIEWER-9.2 turns the document by quarter turns, swapping the page sides', () => {
    const getViewport = vi.fn(({ scale, rotation }: { scale: number; rotation?: number }) => ({
      width: scale,
      height: scale,
      scale,
      rotation,
    }));
    const loaded = {
      rotation: 0,
      pages: [{ rotate: 90, getViewport }],
      sizes: [{ width: 595, height: 420 }],
    } as unknown as LoadedPdf;
    expect(rotatePdf(loaded, 0)).toBe(loaded);
    const turned = rotatePdf(loaded, 90);
    expect(turned.sizes).toEqual([{ width: 420, height: 595 }]);
    expect(turned.getViewport(0, 2)).toMatchObject({ rotation: 180 });
    expect(rotatePdf(turned, 270).sizes).toEqual([{ width: 420, height: 595 }]);
    expect(rotatePdf(turned, 180).sizes).toEqual([{ width: 595, height: 420 }]);
    expect(rotatePdf(turned, 270).getViewport(0, 1)).toMatchObject({ rotation: 0 });
  });

  it('UIC-PDF-VIEWER-9.1 UIC-PDF-VIEWER-9.2 rotates the pages from the commands menu', async () => {
    const engine = createEngine();
    const view = await renderReady({ defaultZoom: 100 }, engine);
    const page = () =>
      requireDefined(view.container.querySelector<HTMLElement>('.ui-pdf-viewer__page'));
    expect(page().style.width).toBe(`${pageSize.width * pointsToPixels}px`);

    await chooseCommand('Rotate clockwise');
    expect(page().style.width).toBe(`${pageSize.height * pointsToPixels}px`);
    expect(page().style.height).toBe(`${pageSize.width * pointsToPixels}px`);
    await waitFor(() =>
      expect(engine.TextLayer).toHaveBeenLastCalledWith(
        expect.objectContaining({
          viewport: expect.objectContaining({ width: pageSize.height * pointsToPixels }),
        }),
      ),
    );
  });

  it('UIC-PDF-VIEWER-9.2 turns counterclockwise and opens a new document unturned', async () => {
    const engine = createEngine();
    const view = await renderReady({ defaultZoom: 100 }, engine);
    const page = () =>
      requireDefined(view.container.querySelector<HTMLElement>('.ui-pdf-viewer__page'));
    await chooseCommand('Rotate counterclockwise');
    expect(page().style.width).toBe(`${pageSize.height * pointsToPixels}px`);
    expect(page().style.height).toBe(`${pageSize.width * pointsToPixels}px`);

    // A new document opens unturned.
    view.rerender(
      <PdfViewer source="/files/Other.pdf" loadEngine={engine.loadEngine} defaultZoom={100} />,
    );
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(page().style.width).toBe(`${pageSize.width * pointsToPixels}px`));
  });
});
