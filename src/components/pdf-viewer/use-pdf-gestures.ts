'use client';

import { useCallback, useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import {
  findPageIndex,
  locateRange,
  measurePageFrame,
  toPagePoint,
  type PdfPagePoint,
  type PdfSelection,
} from './page-geometry.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { useLatest } from '../../utils/use-latest.js';

interface UsePdfGesturesOptions<V extends PdfViewport, C extends PdfTextContent> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C> | null;
  /** CSS pixels per point. */
  scale: number;
  scrollerRef: RefObject<HTMLElement | null>;
  elements: RefObject<ReadonlyMap<number, HTMLElement>>;
  onPageClick?: ((target: PdfPagePoint<V>) => void) | undefined;
  onSelectionChange?: ((selection: PdfSelection<V> | null) => void) | undefined;
}

/** Elements that act on a click of their own: links, controls and anything focusable. */
const interactiveSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
].join(',');

/** Whether `target` sits in an interactive element inside `page`, which keeps the click. */
function isInteractive(target: EventTarget | null, page: Element): boolean {
  if (!(target instanceof Element)) return false;
  const match = target.closest(interactiveSelector);
  return match !== null && page.contains(match);
}

/** The selection, when it holds text and lies inside `scroller`. */
function readSelectedRange(scroller: HTMLElement): { text: string; range: Range } | null {
  const selection = scroller.ownerDocument.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const text = selection.toString();
  const range = selection.getRangeAt(0);
  if (!text.trim() || !scroller.contains(range.commonAncestorContainer)) return null;
  return { text, range };
}

function toSelectionKey(selection: PdfSelection | null): string {
  if (!selection) return '';
  const { pageIndex, text, rect } = selection;
  return [pageIndex, rect.left, rect.top, rect.width, rect.height, text].join(' ');
}

/**
 * Reports each finished selection inside the viewer (on pointer and key release) and its end, once
 * per change. Watching the release rather than every `selectionchange` reports a drag once.
 */
function useSelectionReport<V extends PdfViewport, C extends PdfTextContent>(
  latest: RefObject<UsePdfGesturesOptions<V, C>>,
  scrollerRef: RefObject<HTMLElement | null>,
) {
  const reported = useRef('');
  const report = useCallback(
    (selection: PdfSelection<V> | null) => {
      const key = toSelectionKey(selection);
      if (key === reported.current) return;
      reported.current = key;
      latest.current.onSelectionChange?.(selection);
    },
    [latest],
  );
  const readSelection = useCallback((): PdfSelection<V> | null => {
    const { view, scale, scrollerRef, elements } = latest.current;
    const scroller = scrollerRef.current;
    const selected = scroller ? readSelectedRange(scroller) : null;
    const located = selected ? locateRange(selected.range, elements.current, scale) : null;
    const viewport = located ? view?.getViewport(located.pageIndex, scale) : undefined;
    return selected && located && viewport ? { ...located, text: selected.text, viewport } : null;
  }, [latest]);
  useEffect(() => {
    const document = scrollerRef.current?.ownerDocument;
    if (!document) return undefined;
    const onRelease = () => {
      if (latest.current.onSelectionChange) report(readSelection());
    };
    // A selection that ends without a release here, cleared by a click or a script, ends now.
    const onChange = () => {
      if (reported.current && !readSelection()) report(null);
    };
    document.addEventListener('pointerup', onRelease);
    document.addEventListener('keyup', onRelease);
    document.addEventListener('selectionchange', onChange);
    return () => {
      document.removeEventListener('pointerup', onRelease);
      document.removeEventListener('keyup', onRelease);
      document.removeEventListener('selectionchange', onChange);
    };
  }, [latest, readSelection, report, scrollerRef]);
  return report;
}

/**
 * The reader's primary gestures on the pages, for the caller to act on: a primary click on a page
 * and a finished text selection. Neither is ever prevented: a click that a link, control or the
 * caller's own handler took, or that ended a selection, is not reported.
 */
export function usePdfGestures<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfGesturesOptions<V, C>,
) {
  const latest = useLatest(options);
  const reportSelection = useSelectionReport(latest, options.scrollerRef);
  const document = options.view?.document;
  useEffect(() => () => reportSelection(null), [document, reportSelection]);
  const onClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const { view, scale, scrollerRef, elements, onPageClick } = latest.current;
      const scroller = scrollerRef.current;
      if (!onPageClick || !scroller || event.button !== 0 || event.defaultPrevented) return;
      if (readSelectedRange(scroller)) return;
      const pageIndex = findPageIndex(
        event.target instanceof Node ? event.target : null,
        elements.current,
      );
      const page = elements.current.get(pageIndex);
      const viewport = view?.getViewport(pageIndex, scale);
      if (!page || !viewport || isInteractive(event.target, page)) return;
      const client = { left: event.clientX, top: event.clientY };
      onPageClick({
        pageIndex,
        point: toPagePoint(client, measurePageFrame(page, scale)),
        viewport,
      });
    },
    [latest],
  );
  return { onClick };
}
