import { fireEvent, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { readMenuIcons } from '../../../test/menu-fixtures.js';
import { pointsToPixels, renderReady } from '../../../test/pdf-fixtures.js';
import { CopyGlyph } from '../../core/glyphs.js';
import { requireDefined } from '../../utils/require-defined.js';
import { findBoxAtPoint, type PdfPagePoint } from './page-geometry.js';

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
  if (!run) throw new Error(`no run ${text}`);
  return run;
}

const menuItems = () => screen.queryAllByRole('menuitem').map((item) => item.textContent);

describe('PdfViewer context menu', () => {
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

  it('UIC-PDF-VIEWER-8.1 never opens the browser menu over the pages and opens none without entries', async () => {
    const { container } = await renderReady();
    const canvas = requireDefined(container.querySelector('canvas'));
    expect(fireEvent.contextMenu(canvas, { clientX: 10, clientY: 10 })).toBe(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-PDF-VIEWER-8.2 draws Copy with the icon given, still copying', async () => {
    const user = userEvent.setup();
    const { container } = await renderReady({
      defaultZoom: 100,
      menuIcons: { copy: CopyGlyph },
      getSelectionMenuItems: () => [{ id: 'mark', label: 'Mark selection' }],
    });
    const run = runOf(container, 'The apple harvest began');
    selectText(requireDefined(run.firstChild), 4, 17);
    fireEvent.contextMenu(run, { clientX: 50, clientY: 90 });
    expect(readMenuIcons(screen.getByRole('menu'))).toEqual({
      Copy: 'copy',
      'Mark selection': null,
    });
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('apple harvest');
  });

  it('UIC-PDF-VIEWER-8.1 leaves a menu of caller content alone', async () => {
    const getPageMenuItems = vi.fn(() => [{ id: 'remove', label: 'Remove mark' }]);
    const { container } = await renderReady({
      getPageMenuItems,
      renderPageOverlay: ({ pageIndex }) => (
        <span title={`Mark ${pageIndex}`} onContextMenu={(event) => event.preventDefault()} />
      ),
    });
    fireEvent.contextMenu(screen.getByTitle('Mark 0'));
    expect(getPageMenuItems).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-pdf-viewer__overlay')).not.toBeNull();
  });

  it('UIC-PDF-VIEWER-8.2 UIC-PDF-VIEWER-8.3 copies the selection, then offers the caller entries', async () => {
    const user = userEvent.setup();
    const onMark = vi.fn();
    const getSelectionMenuItems = vi.fn(() => [
      { id: 'mark', label: 'Mark selection', onAction: onMark },
    ]);
    const { container } = await renderReady({ defaultZoom: 100, getSelectionMenuItems });
    const run = runOf(container, 'The apple harvest began');
    selectText(requireDefined(run.firstChild), 4, 17);
    fireEvent.contextMenu(run, { clientX: 50, clientY: 90 });
    expect(menuItems()).toEqual(['Copy', 'Mark selection']);
    expect(getSelectionMenuItems).toHaveBeenCalledWith({
      text: 'apple harvest',
      pageIndex: 0,
      rect: {
        left: 40 / pointsToPixels,
        top: 80 / pointsToPixels,
        width: 120 / pointsToPixels,
        height: 16 / pointsToPixels,
      },
      viewport: expect.objectContaining({ scale: pointsToPixels }),
    });
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'PDF-VIEWER');
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('apple harvest');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    selectText(requireDefined(run.firstChild), 4, 17);
    fireEvent.contextMenu(run, { clientX: 50, clientY: 90 });
    await user.click(screen.getByRole('menuitem', { name: 'Mark selection' }));
    expect(onMark).toHaveBeenCalledTimes(1);
  });

  it('UIC-PDF-VIEWER-8.2 UIC-PDF-VIEWER-8.3 ignores a selection outside the viewer and offers Copy alone off the pages', async () => {
    const getSelectionMenuItems = vi.fn(() => [{ id: 'mark', label: 'Mark selection' }]);
    const getPageMenuItems = vi.fn(() => []);
    const { container } = await renderReady({ getSelectionMenuItems, getPageMenuItems });
    const outside = document.createElement('p');
    outside.textContent = 'Plums ripen late.';
    document.body.append(outside);
    selectText(requireDefined(outside.firstChild), 0, 5);
    const run = runOf(container, 'Markets');
    fireEvent.contextMenu(run);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getPageMenuItems).toHaveBeenCalled();
    outside.remove();

    // Text inside the scroller but on no page can still be copied.
    const stray = document.createElement('span');
    stray.textContent = 'Loose text';
    requireDefined(container.querySelector('.ui-pdf-viewer__scroller')).append(stray);
    selectText(requireDefined(stray.firstChild), 0, 5);
    fireEvent.contextMenu(stray);
    expect(menuItems()).toEqual(['Copy']);
    expect(getSelectionMenuItems).not.toHaveBeenCalled();
  });

  it('UIC-PDF-VIEWER-8.4 offers the caller entries for the spot under the pointer', async () => {
    const marks = [{ key: 'note', left: 20, top: 50, width: 60, height: 20 }];
    const getPageMenuItems = vi.fn(({ point }: PdfPagePoint) =>
      findBoxAtPoint(marks, point) ? [{ id: 'remove', label: 'Remove mark' }] : [],
    );
    const { container } = await renderReady({ defaultZoom: 100, getPageMenuItems });
    const secondPage = requireDefined(container.querySelectorAll('.ui-pdf-viewer__page')[1]);
    fireEvent.contextMenu(secondPage, { clientX: 40, clientY: 80 });
    expect(getPageMenuItems).toHaveBeenLastCalledWith({
      pageIndex: 1,
      point: { left: 40 / pointsToPixels, top: 80 / pointsToPixels },
      viewport: expect.objectContaining({ scale: pointsToPixels }),
    });
    expect(menuItems()).toEqual(['Remove mark']);
    await userEvent.keyboard('{Escape}');

    fireEvent.contextMenu(secondPage, { clientX: 400, clientY: 400 });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.contextMenu(requireDefined(container.querySelector('.ui-pdf-viewer__pages')));
    expect(getPageMenuItems).toHaveBeenCalledTimes(2);
  });
});
