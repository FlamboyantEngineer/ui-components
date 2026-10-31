import { fireEvent, screen } from '@testing-library/react';
import { PointerEventsCheckLevel, userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEngine, pointsToPixels, renderReady } from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { PdfPagePoint } from './page-geometry.js';

/** The client rectangle every selected range reports in these tests. */
const firstLine = { left: 40, top: 80, width: 120, height: 16 } as DOMRect;

function selectText(node: Node, start: number, end: number) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const selection = requireDefined(document.getSelection());
  selection.removeAllRanges();
  selection.addRange(range);
}

function runOf(container: HTMLElement, text: string): HTMLElement {
  const run = [...container.querySelectorAll<HTMLElement>('span[role="presentation"]')].find(
    (element) => element.textContent === text,
  );
  return requireDefined(run);
}

const canvasOf = (container: HTMLElement, pageIndex: number) =>
  requireDefined(container.querySelectorAll('canvas')[pageIndex]);

describe('PdfViewer page clicks', () => {
  afterEach(() => {
    document.getSelection()?.removeAllRanges();
  });

  it('UIC-PDF-VIEWER-11.2 reports a primary click on a page in page coordinates', async () => {
    const user = userEvent.setup();
    const onPageClick = vi.fn((target: PdfPagePoint) => target);
    const { container } = await renderReady({ defaultZoom: 200, onPageClick });
    const canvas = canvasOf(container, 1);
    const clicked = vi.fn((event: MouseEvent) => event.defaultPrevented);
    document.addEventListener('click', clicked);
    await user.pointer({
      keys: '[MouseLeft]',
      target: canvas,
      coords: { clientX: 80, clientY: 160 },
    });
    document.removeEventListener('click', clicked);
    expect(clicked).toHaveLastReturnedWith(false);
    const scale = 2 * pointsToPixels;
    expect(onPageClick).toHaveBeenCalledWith({
      pageIndex: 1,
      point: { left: 80 / scale, top: 160 / scale },
      viewport: expect.objectContaining({ scale }),
    });

    await user.pointer({ keys: '[MouseMiddle]', target: canvas });
    await user.pointer({ keys: '[MouseRight]', target: canvas });
    expect(onPageClick).toHaveBeenCalledTimes(1);
  });

  it('UIC-PDF-VIEWER-11.2 leaves clicks on links, controls and caller-handled content alone', async () => {
    // The host stylesheet gives the engine's links back the pointer that their layer passes through.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    const onPageClick = vi.fn();
    const onRemove = vi.fn();
    const engine = createEngine({
      links: { 0: [{ rect: [0, 0, 10, 10], url: 'https://a.test' }] },
    });
    await renderReady(
      {
        onPageClick,
        renderPageOverlay: ({ pageIndex }) => (
          <>
            <button
              type="button"
              style={{ pointerEvents: 'auto' }}
              onClick={onRemove}
            >{`Remove mark ${pageIndex}`}</button>
            <span title={`Held ${pageIndex}`} onClick={(event) => event.preventDefault()} />
          </>
        ),
      },
      engine,
    );
    const link = screen.getByRole('link', { name: 'https://a.test' });
    link.addEventListener('click', (event) => event.preventDefault());
    await user.click(link);
    await user.click(screen.getByRole('button', { name: 'Remove mark 0' }));
    await user.click(screen.getByTitle('Held 0'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPageClick).not.toHaveBeenCalled();
  });

  it('UIC-PDF-VIEWER-11.2 does not report the click that ends a selection', async () => {
    const user = userEvent.setup();
    const onPageClick = vi.fn();
    const { container } = await renderReady({ onPageClick });
    const run = runOf(container, 'The apple harvest began');
    await user.pointer({ keys: '[MouseLeft>]', target: run });
    selectText(requireDefined(run.firstChild), 4, 17);
    await user.pointer({ keys: '[/MouseLeft]', target: run });
    expect(onPageClick).not.toHaveBeenCalled();
  });
});

describe('PdfViewer selection changes', () => {
  beforeEach(() => {
    Object.defineProperty(Range.prototype, 'getClientRects', {
      configurable: true,
      value: () => [firstLine],
    });
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => firstLine,
    });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    Reflect.deleteProperty(Range.prototype, 'getClientRects');
    Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
  });

  it('UIC-PDF-VIEWER-11.3 reports a finished selection once, then its end', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = await renderReady({ defaultZoom: 100, onSelectionChange });
    const run = runOf(container, 'Pear: a short harvest window.');
    await user.pointer({ keys: '[MouseLeft>]', target: run });
    selectText(requireDefined(run.firstChild), 0, 4);
    expect(onSelectionChange).not.toHaveBeenCalled();

    await user.pointer({ keys: '[/MouseLeft]', target: run });
    await user.keyboard('{Shift}');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith({
      pageIndex: 1,
      text: 'Pear',
      rect: {
        left: 40 / pointsToPixels,
        top: 80 / pointsToPixels,
        width: 120 / pointsToPixels,
        height: 16 / pointsToPixels,
      },
      viewport: expect.objectContaining({ scale: pointsToPixels }),
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.getSelection()?.toString()).toBe('Pear');

    document.getSelection()?.removeAllRanges();
    fireEvent(document, new Event('selectionchange'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    fireEvent(document, new Event('selectionchange'));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it('UIC-PDF-VIEWER-11.3 ignores selections outside the viewer and ends one on unmount', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container, unmount } = await renderReady({ onSelectionChange });
    const outside = document.body.appendChild(document.createElement('p'));
    outside.textContent = 'Elsewhere';
    await user.pointer({ keys: '[MouseLeft>]', target: outside });
    selectText(requireDefined(outside.firstChild), 0, 4);
    await user.pointer({ keys: '[/MouseLeft]', target: outside });
    expect(onSelectionChange).not.toHaveBeenCalled();

    const run = runOf(container, 'Markets');
    await user.pointer({ keys: '[MouseLeft>]', target: run });
    selectText(requireDefined(run.firstChild), 0, 7);
    await user.pointer({ keys: '[/MouseLeft]', target: run });
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageIndex: 2, text: 'Markets' }),
    );
    unmount();
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    outside.remove();
  });
});
