import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEngine,
  pageSize,
  renderViewer,
  stubIntersectionObserver,
} from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { PdfDocumentAccess } from './use-pdf-access.js';

/** Renders a viewer that records every handle it hands out, newest last. */
async function renderWithAccess(engine = createEngine()) {
  const onDocumentChange = vi.fn<(document: PdfDocumentAccess | null) => void>();
  const view = renderViewer({ onDocumentChange }, engine);
  await waitFor(() => expect(onDocumentChange).toHaveBeenCalled());
  const latest = () => requireDefined(onDocumentChange.mock.lastCall)[0];
  return { ...view, onDocumentChange, handle: () => requireDefined(latest()), latest };
}

describe('PdfViewer document access', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-11.1 reads the text of a page that never rendered without scrolling to it', async () => {
    const observer = stubIntersectionObserver();
    const engine = createEngine();
    const { handle, container } = await renderWithAccess(engine);
    await waitFor(() => expect(observer.observed).toHaveLength(3));
    const scroller = requireDefined(container.querySelector('.ui-pdf-viewer__scroller'));

    expect(handle().pageCount).toBe(3);
    const page = await handle().getPageText(2);
    expect(page.pageIndex).toBe(2);
    expect(page.text).toBe('Markets\nNext year the harvest grows.\n');
    expect(page.content.items).toHaveLength(2);
    expect(page.viewport).toEqual({ ...pageSize, scale: 1 });
    expect(engine.render).not.toHaveBeenCalled();
    expect(scroller.scrollTop).toBe(0);
  });

  it('UIC-PDF-VIEWER-11.1 rejects a missing page and passes on the engine error', async () => {
    const engine = createEngine();
    const failure = new Error('Unreadable page');
    const page = await engine.pdf.getPage(2);
    vi.mocked(page.getTextContent).mockRejectedValueOnce(failure);
    const { handle } = await renderWithAccess(engine);

    await expect(handle().getPageText(3)).rejects.toBeInstanceOf(RangeError);
    await expect(handle().getPageText(-1)).rejects.toBeInstanceOf(RangeError);
    await expect(handle().getPageText(1)).rejects.toBe(failure);
  });

  it('UIC-PDF-VIEWER-11.1 reads at the reader rotation through the same handle', async () => {
    const user = userEvent.setup();
    const { handle, onDocumentChange } = await renderWithAccess();
    const first = handle();
    await user.click(screen.getByRole('button', { name: 'More options' }));
    await user.click(
      within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Rotate clockwise' }),
    );
    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const page = await first.getPageText(0);
    expect(page.viewport).toEqual({ width: pageSize.height, height: pageSize.width, scale: 1 });
  });

  it('UIC-PDF-VIEWER-11.1 closes the handle on a new source and on unmount', async () => {
    const engine = createEngine();
    const { handle, latest, onDocumentChange, update, unmount } = await renderWithAccess(engine);
    const first = handle();
    const inFlight = first.getPageText(0);

    update({ onDocumentChange, source: '/files/Other.pdf' });
    expect(onDocumentChange).toHaveBeenNthCalledWith(2, null);
    await expect(inFlight).rejects.toThrow('no longer open');
    await expect(first.getPageText(0)).rejects.toThrow('no longer open');
    await waitFor(() => expect(onDocumentChange).toHaveBeenCalledTimes(3));
    const second = handle();
    expect(second).not.toBe(first);
    await expect(second.getPageText(0)).resolves.toMatchObject({ pageIndex: 0 });

    unmount();
    expect(latest()).toBeNull();
    await expect(second.getPageText(0)).rejects.toThrow('no longer open');
  });

  it('UIC-PDF-VIEWER-11.1 hands no handle for a document that fails to open', async () => {
    const onDocumentChange = vi.fn();
    const engine = createEngine({ failure: new Error('Broken file') });
    const { root } = renderViewer({ onDocumentChange, onError: vi.fn() }, engine);
    await waitFor(() => expect(root).toHaveAttribute('data-error', 'true'));
    expect(onDocumentChange).not.toHaveBeenCalled();
  });
});
