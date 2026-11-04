// The document commands that leave the viewer: printing the pages and saving the file.

import { downloadBlob } from '../../utils/download.js';
import { type PageBitmap, renderPageBitmap } from './page-bitmap.js';
import type { PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';

// Printed pages are drawn at 150 dots per inch: sharp on paper without huge bitmaps.
const printScale = 150 / 72;

/** Draws one page at the print resolution, cancelling the drawing when `signal` aborts. */
async function drawPrintedPage<V extends PdfViewport, C extends PdfTextContent>(
  bitmap: PageBitmap<V, C>,
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<Blob> {
  signal.throwIfAborted();
  const task = renderPageBitmap(bitmap, canvas);
  const cancel = () => task.cancel();
  signal.addEventListener('abort', cancel, { once: true });
  try {
    await task.promise;
  } finally {
    signal.removeEventListener('abort', cancel);
  }
  signal.throwIfAborted();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
  if (!blob) throw new Error('A printed page could not be encoded.');
  return blob;
}

/** Each page as an image at the print resolution, as the document itself sets it, in order. */
async function* drawPrintedPages<V extends PdfViewport, C extends PdfTextContent>(
  loaded: LoadedPdf<V, C>,
  owner: Document,
  signal: AbortSignal,
): AsyncGenerator<Blob> {
  for (const page of loaded.pages) {
    const viewport = page.getViewport({ scale: printScale });
    const canvas = owner.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    yield await drawPrintedPage({ loaded, page, viewport }, canvas, signal);
  }
}

function whenLoaded(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  });
}

/**
 * Lays the page images out in the frame's document, one printed sheet each: every image sits in a
 * block one page tall and fits inside it. The frame's body, and its margin, are left out.
 */
async function fillPrintFrame(frame: HTMLIFrameElement, urls: readonly string[]): Promise<void> {
  const frameDocument = frame.contentDocument;
  if (!frameDocument) throw new Error('The print frame has no document.');
  frameDocument.body.remove();
  const loads = urls.map((url) => {
    const sheet = frameDocument.createElement('div');
    sheet.style.height = '100vh';
    const image = frameDocument.createElement('img');
    image.style.maxWidth = '100%';
    image.style.maxHeight = '100%';
    image.alt = '';
    image.src = url;
    sheet.append(image);
    frameDocument.documentElement.append(sheet);
    return whenLoaded(image);
  });
  await Promise.all(loads);
}

function createPrintFrame(owner: Document): HTMLIFrameElement {
  const frame = owner.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.visibility = 'hidden';
  owner.body.append(frame);
  return frame;
}

/**
 * Prints every page through the browser's print dialog: the pages are drawn as images into a
 * hidden frame in the viewer's document `owner`, which is printed and removed once printing is over.
 * The frame and every image drawn so far are released as well when a page fails to draw or encode,
 * the frame fails to fill or print, or `signal` aborts, which also cancels the page being drawn.
 * Rejects with the failure, or with the abort reason.
 */
export async function printPdf<V extends PdfViewport, C extends PdfTextContent>(
  loaded: LoadedPdf<V, C>,
  owner: Document,
  signal: AbortSignal = new AbortController().signal,
): Promise<void> {
  const frame = createPrintFrame(owner);
  const urls: string[] = [];
  let isReleased = false;
  const release = () => {
    if (isReleased) return;
    isReleased = true;
    signal.removeEventListener('abort', release);
    frame.remove();
    for (const url of urls) URL.revokeObjectURL(url);
  };
  signal.addEventListener('abort', release, { once: true });
  try {
    // Every image's address is kept as soon as it exists, so a failure on a later page releases it.
    for await (const blob of drawPrintedPages(loaded, owner, signal)) {
      signal.throwIfAborted();
      urls.push(URL.createObjectURL(blob));
    }
    await fillPrintFrame(frame, urls);
    signal.throwIfAborted();
    const frameWindow = frame.contentWindow;
    if (!frameWindow) throw new Error('The print frame has no window.');
    frameWindow.addEventListener('afterprint', release, { once: true });
    frameWindow.print();
  } catch (error) {
    release();
    throw error;
  }
}

/** The name a document saves under: the file name in its URL, else its label. */
export function toPdfFileName(source: PdfSource | null, label: string): string {
  if (typeof source === 'string' || source instanceof URL) {
    try {
      const { pathname } = new URL(source, 'https://localhost/');
      const name = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1));
      if (/\.pdf$/i.test(name)) return name;
    } catch {
      // A malformed path falls back to the label.
    }
  }
  return `${label}.pdf`;
}

/** Saves the document's own bytes as `fileName`. */
export async function downloadPdf<V extends PdfViewport, C extends PdfTextContent>(
  loaded: LoadedPdf<V, C>,
  fileName: string,
): Promise<void> {
  const bytes = await loaded.document.getData();
  downloadBlob(new Blob([bytes.slice()], { type: 'application/pdf' }), fileName);
}
