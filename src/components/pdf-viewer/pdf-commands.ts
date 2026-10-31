// The document commands that leave the viewer: printing the pages and saving the file.

import { downloadBlob } from '../../utils/download.js';
import type { PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import { renderPageBitmap } from './page-bitmap.js';
import type { LoadedPdf } from './use-pdf-document.js';

// Printed pages are drawn at 150 dots per inch: sharp on paper without huge bitmaps.
const printScale = 150 / 72;

/** Each page as an image at the print resolution, as the document itself sets it. */
async function drawPrintedPages<V extends PdfViewport, C extends PdfTextContent>(
  loaded: LoadedPdf<V, C>,
): Promise<string[]> {
  const urls: string[] = [];
  for (const page of loaded.pages) {
    const viewport = page.getViewport({ scale: printScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await renderPageBitmap({ loaded, page, viewport }, canvas).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
    if (blob) urls.push(URL.createObjectURL(blob));
  }
  return urls;
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
  if (!frameDocument) return;
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

/**
 * Prints every page through the browser's print dialog: the pages are drawn as images into a
 * hidden frame, which is printed and removed once printing is over.
 */
export async function printPdf<V extends PdfViewport, C extends PdfTextContent>(
  loaded: LoadedPdf<V, C>,
): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.visibility = 'hidden';
  document.body.append(frame);
  const urls = await drawPrintedPages(loaded);
  const release = () => {
    frame.remove();
    for (const url of urls) URL.revokeObjectURL(url);
  };
  try {
    await fillPrintFrame(frame, urls);
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
