import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderReady, stubLayout } from '../../../test/pdf-fixtures.js';
import { readPageKey, readShortcut } from './use-pdf-keyboard.js';

const scroller = () => screen.getByRole('document');

const modifierKeys = new Set(['Control', 'Meta', 'Shift', 'Alt']);

/**
 * Presses `keys` on the focused element and reports whether the last non-modifier keydown they
 * produced was left to the browser (its default not prevented).
 */
async function pressUnhandled(user: ReturnType<typeof userEvent.setup>, keys: string) {
  let pressed: KeyboardEvent | undefined;
  const listen = (event: KeyboardEvent) => {
    if (!modifierKeys.has(event.key)) pressed = event;
  };
  window.addEventListener('keydown', listen, true);
  await user.keyboard(keys);
  window.removeEventListener('keydown', listen, true);
  if (!pressed) throw new Error(`No keydown for ${keys}`);
  return !pressed.defaultPrevented;
}

function focus(element: HTMLElement) {
  act(() => element.focus());
}

describe('PdfViewer keyboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-3.5 UIC-PDF-VIEWER-5.8 reads the shortcut a key stands for', () => {
    expect(readShortcut('F')).toBe('find');
    expect(readShortcut('=')).toBe('zoom-in');
    expect(readShortcut('+')).toBe('zoom-in');
    expect(readShortcut('-')).toBe('zoom-out');
    expect(readShortcut('0')).toBe('zoom-reset');
    expect(readShortcut('p')).toBeNull();
  });

  it('UIC-PDF-VIEWER-4.6 reads the page a page key leads to', () => {
    const position = { currentPage: 1, pageCount: 3, isPageFit: false };
    expect(readPageKey('Home', position)).toBe(0);
    expect(readPageKey('End', position)).toBe(2);
    expect(readPageKey('PageDown', position)).toBeNull();
    expect(readPageKey('PageDown', { ...position, isPageFit: true })).toBe(2);
    expect(readPageKey('PageDown', { ...position, currentPage: 2, isPageFit: true })).toBe(2);
    expect(readPageKey('PageUp', { ...position, isPageFit: true })).toBe(0);
    expect(readPageKey('ArrowDown', { ...position, isPageFit: true })).toBeNull();
  });

  it('UIC-PDF-VIEWER-3.5 steps and resets the zoom with Ctrl and + - 0', async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    await renderReady({ defaultZoom: 100, onZoomChange });
    focus(scroller());
    expect(await pressUnhandled(user, '{Control>}={/Control}')).toBe(false);
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    focus(screen.getByRole('slider'));
    await user.keyboard('{Meta>}+{/Meta}');
    expect(onZoomChange).toHaveBeenLastCalledWith(150);
    focus(scroller());
    await user.keyboard('{Control>}-{/Control}');
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    await user.keyboard('{Control>}0{/Control}');
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
    expect(await pressUnhandled(user, '=')).toBe(true);
    expect(await pressUnhandled(user, '{Control>}{Alt>}={/Alt}{/Control}')).toBe(true);
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
  });

  it('UIC-PDF-VIEWER-5.8 focuses the find field with Ctrl + F unless the caller draws the find', async () => {
    const user = userEvent.setup();
    const view = await renderReady();
    const field = screen.getByRole('searchbox');
    await user.type(field, 'pear');
    focus(scroller());
    expect(await pressUnhandled(user, '{Control>}f{/Control}')).toBe(false);
    expect(field).toHaveFocus();
    expect((field as HTMLInputElement).selectionStart).toBe(0);
    expect((field as HTMLInputElement).selectionEnd).toBe(4);

    view.update({ renderSearch: () => null });
    focus(scroller());
    expect(await pressUnhandled(user, '{Control>}f{/Control}')).toBe(true);
  });

  it('UIC-PDF-VIEWER-4.6 goes to the first and last page with Home and End', async () => {
    const user = userEvent.setup();
    stubLayout();
    await renderReady({ defaultZoom: 100 });
    focus(scroller());
    expect(await pressUnhandled(user, '{End}')).toBe(false);
    expect(scroller().scrollTop).toBe(1600);
    expect(screen.getByLabelText('Page')).toHaveValue('3');
    await user.keyboard('{Home}');
    expect(scroller().scrollTop).toBe(0);
    // Page Down keeps its native scrolling unless the whole page fits.
    expect(await pressUnhandled(user, '{PageDown}')).toBe(true);
    expect(scroller().scrollTop).toBe(0);
  });

  it('UIC-PDF-VIEWER-4.6 turns pages that fit the view with Page Up and Page Down', async () => {
    const user = userEvent.setup();
    stubLayout();
    await renderReady({ defaultZoom: 'page-fit' });
    focus(scroller());
    expect(await pressUnhandled(user, '{PageDown}')).toBe(false);
    expect(scroller().scrollTop).toBe(800);
    await user.keyboard('{PageDown}{PageUp}');
    expect(scroller().scrollTop).toBe(800);
    expect(await pressUnhandled(user, '{Control>}{PageUp}{/Control}')).toBe(true);
  });
});
