'use client';

import { useCallback, useEffect } from 'react';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import { createPageText } from './pdf-search.js';
import { toPageRotation } from './page-geometry.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { useLatest } from '../../utils/use-latest.js';

/** A page's text, read from the document whether or not the page has rendered. */
export interface PdfPageContent<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  pageIndex: number;
  /** The page's text runs joined, with a line break after each run that ends a line. */
  text: string;
  /** The engine's own text content, whose runs carry their geometry in PDF user space. */
  content: C;
  /**
   * The engine's viewport of the page at 100% zoom and the reader's rotation: it maps the runs'
   * user-space geometry to points from the page's top-left corner as displayed.
   */
  viewport: V;
}

/** The open document, for reading pages the reader has not reached. */
export interface PdfDocumentAccess<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  pageCount: number;
  /**
   * A page's text, zero-based. Rejects with a `RangeError` for a page the document does not have,
   * with the engine's error when it cannot read the page, and once this document is no longer open.
   */
  getPageText(pageIndex: number): Promise<PdfPageContent<V, C>>;
}

interface UsePdfAccessOptions<V extends PdfViewport, C extends PdfTextContent> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C> | null;
  onDocumentChange?: ((document: PdfDocumentAccess<V, C> | null) => void) | undefined;
}

/**
 * A handle on one open document: `read` gives the document as the reader turns it now, or `null`
 * once it has closed, after which every read is refused.
 */
function createDocumentAccess<V extends PdfViewport, C extends PdfTextContent>(
  pageCount: number,
  read: () => LoadedPdf<V, C> | null,
): PdfDocumentAccess<V, C> {
  const closed = () => new Error('The document is no longer open');
  return {
    pageCount,
    async getPageText(pageIndex) {
      const view = read();
      if (!view) throw closed();
      const page = view.pages[pageIndex];
      if (!page) throw new RangeError(`No page ${pageIndex}`);
      const content = await view.getTextContent(pageIndex);
      if (!read()) throw closed();
      const viewport = page.getViewport({
        scale: 1,
        rotation: toPageRotation(page, view.rotation),
      });
      return { pageIndex, text: createPageText(content).text, content, viewport };
    },
  };
}

/**
 * Hands the caller a handle on each document that opens, and `null` when it closes: on a new
 * source, a failure or unmount. The handle lasts through zoom and rotation; a closed one refuses
 * reads.
 */
export function usePdfAccess<V extends PdfViewport, C extends PdfTextContent>({
  view,
  onDocumentChange,
}: UsePdfAccessOptions<V, C>): void {
  const latest = useLatest(onDocumentChange);
  // The caller's latest callback hears of the closing too, not the one the opening found.
  const notify = useCallback(
    (document: PdfDocumentAccess<V, C> | null) => latest.current?.(document),
    [latest],
  );
  const latestView = useLatest(view);
  const document = view?.document;
  const pageCount = view?.pages.length ?? 0;
  useEffect(() => {
    if (!document) return undefined;
    let isOpen = true;
    // The latest view may already hold the next document before this effect is cleaned up.
    const read = () => {
      const current = latestView.current;
      return isOpen && current?.document === document ? current : null;
    };
    notify(createDocumentAccess(pageCount, read));
    return () => {
      isOpen = false;
      notify(null);
    };
  }, [document, pageCount, notify, latestView]);
}
