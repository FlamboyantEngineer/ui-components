'use client';

import { type KeyboardEvent, type RefObject, useCallback } from 'react';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isNode } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';
import { readCommandKey } from '../shortcut/shortcut.js';
import { findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { type PdfZoom, resolveZoomLevels } from './pdf-zoom.js';
import type { PdfPagesController } from './use-pdf-pages.js';
import type { PdfZoomState } from './use-pdf-zoom.js';

/** Widgets a caller may draw over a page that use Home, End and the page keys themselves. */
const keyOwningWidgets = [
  'slider',
  'spinbutton',
  'textbox',
  'combobox',
  'listbox',
  'grid',
  'tree',
  'treegrid',
  'menu',
  'tablist',
]
  .map((role) => `[role="${role}"]`)
  .join(', ');

/**
 * Whether a key press belongs to something inside the scroller rather than to the page scroller:
 * a field, editable content or a key-owning widget, a press another handler already took, or one
 * that confirms an input method's text.
 */
function isOwnedInside(event: KeyboardEvent<HTMLElement>) {
  return (
    event.defaultPrevented ||
    isComposingKey(event.nativeEvent) ||
    (event.target !== event.currentTarget && isEditableTarget(event.target, keyOwningWidgets))
  );
}

interface UsePdfKeyboardOptions {
  isReady: boolean;
  zoom: Pick<PdfZoomState, 'zoom' | 'percent' | 'setZoom'> & Partial<Pick<PdfZoomState, 'levels'>>;
  /** The zoom Ctrl + 0 returns to. */
  defaultZoom: PdfZoom;
  pages: Pick<PdfPagesController, 'currentPage' | 'scrollToPage'>;
  pageCount: number;
  /** The viewer's own find field, which Ctrl + F focuses; empty while the caller draws the find. */
  findFieldRef: RefObject<HTMLInputElement | null>;
}

export interface PdfKeyboard {
  /** Shortcuts anywhere in the viewer and its toolbar. */
  onViewerKeyDown(event: KeyboardEvent<HTMLElement>): void;
  /** Page keys in the page scroller. */
  onScrollerKeyDown(event: KeyboardEvent<HTMLElement>): void;
}

type Shortcut = 'find' | 'zoom-in' | 'zoom-out' | 'zoom-reset';

/** The viewer shortcut a key pressed with Ctrl or Command stands for. */
export function readShortcut(key: string): Shortcut | null {
  switch (key.toLowerCase()) {
    case 'f':
      return 'find';
    case '+':
    case '=':
      return 'zoom-in';
    case '-':
      return 'zoom-out';
    case '0':
      return 'zoom-reset';
    default:
      return null;
  }
}

/** The page a page key leads to, or `null` when the key keeps its native scrolling. */
export function readPageKey(
  key: string,
  {
    currentPage,
    pageCount,
    isPageFit,
  }: { currentPage: number; pageCount: number; isPageFit: boolean },
): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return pageCount - 1;
  // A page that fits the view turns with Page Up and Page Down; a larger one scrolls through.
  if (!isPageFit) return null;
  if (key === 'PageDown') return Math.min(currentPage + 1, pageCount - 1);
  if (key === 'PageUp') return Math.max(currentPage - 1, 0);
  return null;
}

/**
 * The viewer's keyboard: Ctrl or Command with F focuses the find field, with + and - steps the zoom
 * and with 0 returns to the opening zoom, instead of the browser's own. In the page scroller, Home
 * and End go to the first and last page, and Page Up and Page Down turn pages that fit the view,
 * unless a field or widget drawn over a page, or another handler, takes the key.
 */
export function usePdfKeyboard(options: UsePdfKeyboardOptions): PdfKeyboard {
  const latest = useLatest(options);

  const onViewerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey) return;
      const shortcut = readShortcut(readCommandKey(event));
      if (event.shiftKey && shortcut !== 'zoom-in') return;
      const { isReady, zoom, defaultZoom, findFieldRef } = latest.current;
      const field = findFieldRef.current;
      if (shortcut === 'find' && field) {
        event.preventDefault();
        field.focus();
        field.select();
        return;
      }
      if (!isReady || shortcut === null || shortcut === 'find') return;
      event.preventDefault();
      if (shortcut === 'zoom-reset') return zoom.setZoom(defaultZoom);
      const level = findNextZoomLevel(
        resolveZoomLevels(zoom.levels),
        zoom.percent,
        shortcut === 'zoom-in' ? 1 : -1,
      );
      if (level !== undefined) zoom.setZoom(level);
    },
    [latest],
  );

  const onScrollerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const { isReady, pages, pageCount, zoom } = latest.current;
      const isOwn = isNode(event.target) && event.currentTarget.contains(event.target);
      if (!isReady || !isOwn || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isOwnedInside(event)) return;
      const pageIndex = readPageKey(event.key, {
        currentPage: pages.currentPage,
        pageCount,
        isPageFit: zoom.zoom === 'page-fit',
      });
      if (pageIndex === null) return;
      event.preventDefault();
      pages.scrollToPage(pageIndex);
    },
    [latest],
  );

  return { onViewerKeyDown, onScrollerKeyDown };
}
