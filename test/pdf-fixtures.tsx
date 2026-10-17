// Shared fixtures for the PDF viewer's unit tests: a stand-in engine with three pages of text.

import { render, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
import {
  isTextItem,
  type PdfDocumentParams,
  type PdfEngine,
  type PdfTextContent,
  type PdfTextLayer,
  type PdfTextLayerOptions,
} from '../src/components/pdf-viewer/pdf-engine.js';
import { PdfViewer, type PdfViewerProps } from '../src/components/pdf-viewer/pdf-viewer.js';

export const sampleLines = [
  ['Seasonal Report', 'The apple harvest began', 'and the pear harvest followed.'],
  ['Varieties', 'Pear: a short harvest window.'],
  ['Markets', 'Next year the harvest grows.'],
];

/** CSS pixels per point at 100%. */
export const pointsToPixels = 96 / 72;

/** Each sample page is 420 by 595 points. */
export const pageSize = { width: 420, height: 595 };

export function createTextContent(lines: readonly string[]): PdfTextContent {
  return { items: lines.map((str) => ({ str, hasEOL: true })) };
}

function createTextLayer({ textContentSource, container }: PdfTextLayerOptions): PdfTextLayer {
  const texts = textContentSource.items.filter(isTextItem).map((item) => item.str);
  const runs = texts.map((text) => {
    const run = document.createElement('span');
    run.setAttribute('role', 'presentation');
    run.textContent = text;
    return run;
  });
  return {
    textDivs: runs,
    textContentItemsStr: texts,
    render: async () => container.append(...runs),
    cancel: vi.fn(),
  };
}

export function createEngine({
  lines = sampleLines,
  failure,
}: { lines?: string[][]; failure?: Error } = {}) {
  const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
  const pages = lines.map((pageLines) => ({
    getViewport: ({ scale }: { scale: number }) => ({
      width: pageSize.width * scale,
      height: pageSize.height * scale,
      scale,
    }),
    render,
    getTextContent: vi.fn(async () => createTextContent(pageLines)),
  }));
  const pdf = {
    numPages: pages.length,
    getPage: async (pageNumber: number) => pages[pageNumber - 1]!,
  };
  const destroy = vi.fn(async () => undefined);
  const getDocument = vi.fn((_params: PdfDocumentParams) => ({
    promise: failure ? Promise.reject(failure) : Promise.resolve(pdf),
    destroy,
  }));
  const TextLayer = vi.fn(function (options: PdfTextLayerOptions) {
    return createTextLayer(options);
  });
  const engine: PdfEngine = {
    getDocument,
    GlobalWorkerOptions: { workerSrc: '' },
    TextLayer: TextLayer as unknown as PdfEngine['TextLayer'],
    AnnotationMode: { DISABLE: 0 },
  };
  return { engine, render, getDocument, destroy, TextLayer, loadEngine: vi.fn(async () => engine) };
}

export type TestEngine = ReturnType<typeof createEngine>;

export function renderViewer(props: Partial<PdfViewerProps> = {}, engine = createEngine()) {
  const viewer = (next: Partial<PdfViewerProps>) => (
    <PdfViewer
      aria-label="Report"
      source="/files/Report.pdf"
      loadEngine={engine.loadEngine}
      {...next}
    />
  );
  const view = render(viewer(props));
  return {
    ...view,
    engine,
    root: view.container.firstElementChild as HTMLElement,
    /** Renders the viewer again with these props instead. */
    update: (next: Partial<PdfViewerProps>) => view.rerender(viewer(next)),
  };
}

/** Renders the viewer and waits until every page's text layer is built. */
export async function renderReady(props: Partial<PdfViewerProps> = {}, engine = createEngine()) {
  const view = renderViewer(props, engine);
  await waitFor(() =>
    expect(view.container.querySelectorAll('[role="presentation"]')).toHaveLength(7),
  );
  return view;
}

/**
 * Lays the viewer out as a browser would: the scroller shows 600 by 600 pixels and the pages sit
 * 800 pixels apart in the page column after a 12 pixel inset. jsdom lays nothing out.
 */
export function stubLayout(): void {
  const isScroller = (element: HTMLElement) =>
    element.classList.contains('ui-pdf-viewer__scroller');
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return isScroller(this) ? 600 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return isScroller(this) ? 600 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.classList.contains('ui-pdf-viewer__page') || !this.parentElement) return 0;
    return 12 + [...this.parentElement.children].indexOf(this) * 800;
  });
}

type ObserverCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

/** Replaces `IntersectionObserver`, so a test decides which pages are near the view. */
export function stubIntersectionObserver() {
  const observers: ObserverCallback[] = [];
  const observed: Element[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (callback: ObserverCallback) {
      observers.push(callback);
      return {
        observe: (element: Element) => observed.push(element),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    }),
  );
  return {
    observed,
    /** Reports pages as near the view or not. */
    report(pageIndexes: readonly number[], isIntersecting: boolean) {
      const entries = pageIndexes.map((index) => ({ target: observed[index]!, isIntersecting }));
      observers[0]?.(entries);
    },
  };
}

export const searchStatus = () => document.querySelector('.ui-pdf-viewer__search-status');
