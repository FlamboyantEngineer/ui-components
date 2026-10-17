import { fireEvent, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderReady, stubLayout } from '../../../test/pdf-fixtures.js';
import { readPageKey, readShortcut } from './use-pdf-keyboard.js';

const scroller = () => screen.getByRole('document');

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
    const onZoomChange = vi.fn();
    await renderReady({ defaultZoom: 100, onZoomChange });
    expect(fireEvent.keyDown(scroller(), { key: '=', ctrlKey: true })).toBe(false);
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    fireEvent.keyDown(screen.getByRole('slider'), { key: '+', metaKey: true });
    expect(onZoomChange).toHaveBeenLastCalledWith(150);
    fireEvent.keyDown(scroller(), { key: '-', ctrlKey: true });
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    fireEvent.keyDown(scroller(), { key: '0', ctrlKey: true });
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
    expect(fireEvent.keyDown(scroller(), { key: '=' })).toBe(true);
    expect(fireEvent.keyDown(scroller(), { key: '=', ctrlKey: true, altKey: true })).toBe(true);
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
  });

  it('UIC-PDF-VIEWER-5.8 focuses the find field with Ctrl + F unless the caller draws the find', async () => {
    const view = await renderReady();
    const field = screen.getByRole('searchbox');
    await userEvent.type(field, 'pear');
    scroller().focus();
    expect(fireEvent.keyDown(scroller(), { key: 'f', ctrlKey: true })).toBe(false);
    expect(field).toHaveFocus();
    expect((field as HTMLInputElement).selectionStart).toBe(0);
    expect((field as HTMLInputElement).selectionEnd).toBe(4);

    view.update({ renderSearch: () => null });
    expect(fireEvent.keyDown(scroller(), { key: 'f', ctrlKey: true })).toBe(true);
  });

  it('UIC-PDF-VIEWER-4.6 goes to the first and last page with Home and End', async () => {
    stubLayout();
    await renderReady({ defaultZoom: 100 });
    expect(fireEvent.keyDown(scroller(), { key: 'End' })).toBe(false);
    expect(scroller().scrollTop).toBe(1600);
    expect(screen.getByLabelText('Page')).toHaveValue('3');
    fireEvent.keyDown(scroller(), { key: 'Home' });
    expect(scroller().scrollTop).toBe(0);
    // Page Down keeps its native scrolling unless the whole page fits.
    expect(fireEvent.keyDown(scroller(), { key: 'PageDown' })).toBe(true);
    expect(scroller().scrollTop).toBe(0);
  });

  it('UIC-PDF-VIEWER-4.6 turns pages that fit the view with Page Up and Page Down', async () => {
    stubLayout();
    await renderReady({ defaultZoom: 'page-fit' });
    expect(fireEvent.keyDown(scroller(), { key: 'PageDown' })).toBe(false);
    expect(scroller().scrollTop).toBe(800);
    fireEvent.keyDown(scroller(), { key: 'PageDown' });
    fireEvent.keyDown(scroller(), { key: 'PageUp' });
    expect(scroller().scrollTop).toBe(800);
    expect(fireEvent.keyDown(scroller(), { key: 'PageUp', ctrlKey: true })).toBe(true);
  });
});
