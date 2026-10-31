// Shared fixtures for the PDF viewer's unit tests: a stand-in engine with three pages of text.

import { act, render, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
import {
  isTextItem,
  type PdfAnnotationLayerParams,
  type PdfDocumentParams,
  type PdfEngine,
  type PdfOutlineNode,
  type PdfRenderParams,
  type PdfTextContent,
  type PdfTextLayer,
  type PdfTextLayerOptions,
  type PdfTouchManagerOptions,
} from '../src/components/pdf-viewer/pdf-engine.js';
import { PdfViewer, type PdfViewerProps } from '../src/components/pdf-viewer/pdf-viewer.js';
import { requireDefined } from '../src/utils/require-defined.js';

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

/** A link annotation as the engine reports it: to the web, to a destination or a named action. */
export interface TestLink {
  rect: [number, number, number, number];
  url?: string;
  dest?: string | unknown[];
  action?: string;
}

export interface TestEngineOptions {
  lines?: string[][];
  failure?: Error;
  /** The password the document asks for before it opens. */
  password?: string;
  /** Link annotations by page index. */
  links?: Record<number, TestLink[]>;
  outline?: PdfOutlineNode[] | null;
  /** Named destinations; explicit ones point at pages as `{ num: pageIndex, gen: 0 }`. */
  destinations?: Record<string, unknown[]>;
}

const passwordResponses = { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 };

function createPage(pageLines: readonly string[], links: readonly TestLink[]) {
  return {
    rotate: 0,
    view: [0, 0, pageSize.width, pageSize.height],
    getViewport: ({ scale, rotation = 0 }: { scale: number; rotation?: number }) => {
      const isQuarterTurn = rotation % 180 !== 0;
      const { width, height } = pageSize;
      return {
        width: (isQuarterTurn ? height : width) * scale,
        height: (isQuarterTurn ? width : height) * scale,
        scale,
      };
    },
    getTextContent: vi.fn(async () => createTextContent(pageLines)),
    getAnnotations: vi.fn(async () => [
      ...links.map((link) => ({ subtype: 'Link', ...link })),
      { subtype: 'Text', rect: [0, 0, 20, 20] },
    ]),
  };
}

/** Draws each annotation as the engine draws a link: an anchor wired to the viewer's link service. */
function renderLinks({ annotations, div, linkService }: PdfAnnotationLayerParams) {
  for (const annotation of annotations as TestLink[]) {
    const section = document.createElement('section');
    const link = document.createElement('a');
    if (annotation.url) linkService.addLinkAttributes(link, annotation.url);
    if (annotation.dest) {
      link.href = linkService.getDestinationHash(annotation.dest);
      link.onclick = () => {
        linkService.goToDestination(annotation.dest);
        return false;
      };
    }
    if (annotation.action) {
      link.href = linkService.getAnchorUrl('');
      link.onclick = () => {
        linkService.executeNamedAction(annotation.action ?? '');
        return false;
      };
    }
    link.textContent = annotation.url ?? String(annotation.dest ?? annotation.action);
    section.append(link);
    div.append(section);
  }
  return Promise.resolve();
}

/** A loading task that asks for `password` until it is given, or opens at once. */
function createLoadingTask<T>(open: () => Promise<T>, password: string | undefined) {
  const task = {
    promise: undefined as unknown as Promise<T>,
    destroy: vi.fn(async () => undefined),
    onPassword: null as unknown,
  };
  task.promise = new Promise<T>((resolve, reject) => {
    if (password === undefined) {
      open().then(resolve, reject);
      return;
    }
    const ask = (reason: number) => {
      const onPassword = task.onPassword as (update: (value: string) => void, why: number) => void;
      onPassword((value) => {
        if (value === password) open().then(resolve, reject);
        else setTimeout(() => ask(passwordResponses.INCORRECT_PASSWORD));
      }, reason);
    };
    setTimeout(() => ask(passwordResponses.NEED_PASSWORD));
  });
  return task;
}

export function createEngine({
  lines = sampleLines,
  failure,
  password,
  links = {},
  outline = null,
  destinations = {},
}: TestEngineOptions = {}) {
  const render = vi.fn((_params: PdfRenderParams) => ({
    promise: Promise.resolve(),
    cancel: vi.fn(),
  }));
  const pages = lines.map((pageLines, index) => ({
    ...createPage(pageLines, links[index] ?? []),
    render,
  }));
  const getData = vi.fn(async () => new Uint8Array([37, 80, 68, 70]));
  const pdf = {
    numPages: pages.length,
    getPage: async (pageNumber: number) => requireDefined(pages[pageNumber - 1]),
    getOutline: vi.fn(async () => outline),
    getDestination: vi.fn(async (name: string) => destinations[name] ?? null),
    getPageIndex: vi.fn(async (ref: { num: number }) => ref.num),
    getData,
  };
  const destroy = vi.fn(async () => undefined);
  const getDocument = vi.fn((_params: PdfDocumentParams) => {
    const task = createLoadingTask(
      () => (failure ? Promise.reject(failure) : Promise.resolve(pdf)),
      password,
    );
    task.destroy = destroy;
    return task;
  });
  const TextLayer = vi.fn(function (options: PdfTextLayerOptions) {
    return createTextLayer(options);
  });
  const AnnotationLayer = vi.fn(function () {
    return { render: renderLinks, destroy: vi.fn() };
  });
  const touch: { options: PdfTouchManagerOptions | null } = { options: null };
  const touchManagers: Array<{ destroy: () => void }> = [];
  const TouchManager = vi.fn(function (options: PdfTouchManagerOptions) {
    touch.options = options;
    const manager = { destroy: vi.fn() };
    touchManagers.push(manager);
    return manager;
  });
  const engine: PdfEngine = {
    getDocument,
    GlobalWorkerOptions: { workerSrc: '' },
    TextLayer: TextLayer as unknown as PdfEngine['TextLayer'],
    AnnotationLayer: AnnotationLayer as unknown as PdfEngine['AnnotationLayer'],
    TouchManager: TouchManager as unknown as PdfEngine['TouchManager'],
    AnnotationMode: { DISABLE: 0, ENABLE: 1 },
    PasswordResponses: passwordResponses,
  };
  return {
    engine,
    render,
    getDocument,
    destroy,
    TextLayer,
    AnnotationLayer,
    touch,
    touchManagers,
    pdf,
    loadEngine: vi.fn(async () => engine),
  };
}

export type TestEngine = ReturnType<typeof createEngine>;

/**
 * Holds every named destination lookup of the engine until the test settles it, so lookups can
 * finish in any order.
 */
export function holdDestinations(engine: TestEngine) {
  const lookups = new Map<string, (destination: unknown[] | null) => void>();
  engine.pdf.getDestination.mockImplementation(
    (name: string) =>
      new Promise<unknown[] | null>((resolve) => {
        lookups.set(name, resolve);
      }),
  );
  return {
    /** Finishes the pending lookup of `name` with `destination`. */
    async settle(name: string, destination: unknown[] | null) {
      await waitFor(() => expect(lookups.has(name)).toBe(true));
      await act(async () => {
        requireDefined(lookups.get(name))(destination);
        await Promise.resolve();
      });
    },
  };
}

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
    expect(view.container.querySelectorAll('span[role="presentation"]')).toHaveLength(7),
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
      const entries = pageIndexes.map((index) => ({
        target: requireDefined(observed[index]),
        isIntersecting,
      }));
      observers[0]?.(entries);
    },
  };
}

export const searchStatus = () => document.querySelector('.ui-pdf-viewer .ui-find-bar__status');
