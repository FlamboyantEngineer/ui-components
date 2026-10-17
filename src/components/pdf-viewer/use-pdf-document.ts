import { useEffect, useState } from 'react';
import {
  toDocumentParams,
  type PdfEngine,
  type PdfLoadingTask,
  type PdfPage,
  type PdfSource,
  type PdfTextContent,
  type PdfViewport,
} from './pdf-engine.js';
import type { PdfSize } from './pdf-zoom.js';
import { useLatest } from './use-latest.js';

export type PdfDocumentStatus = 'loading' | 'ready' | 'error';

/** An opened document: the engine that opened it, its pages and their text. */
export interface LoadedPdf<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  engine: PdfEngine<V, C>;
  pages: PdfPage<V, C>[];
  /** Each page's size at 100% zoom, in points. */
  sizes: PdfSize[];
  /** A page's text content, fetched once and shared by its text layer and the search. */
  getTextContent(pageIndex: number): Promise<C>;
}

export interface UsePdfDocumentOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  source: PdfSource | null;
  loadEngine: () => Promise<PdfEngine<V, C>>;
  workerSrc?: string | undefined;
  onError?: ((error: Error) => void) | undefined;
}

export interface PdfDocumentResult<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  status: PdfDocumentStatus;
  loaded: LoadedPdf<V, C> | null;
  retry(): void;
}

interface LoadControl {
  isCancelled: boolean;
  task: Pick<PdfLoadingTask, 'destroy'> | null;
}

/** The outcome of one load: the opened document, or `null` when it could not be opened. */
interface LoadResult<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  source: PdfSource;
  attempt: number;
  loaded: LoadedPdf<V, C> | null;
}

function createTextCache<V extends PdfViewport, C extends PdfTextContent>(
  pages: readonly PdfPage<V, C>[],
): LoadedPdf<V, C>['getTextContent'] {
  const cache = new Map<number, Promise<C>>();
  return (pageIndex) => {
    const page = pages[pageIndex];
    if (!page) return Promise.reject(new RangeError(`No page ${pageIndex}`));
    const content = cache.get(pageIndex) ?? page.getTextContent();
    cache.set(pageIndex, content);
    return content;
  };
}

async function loadPdf<V extends PdfViewport, C extends PdfTextContent>(
  { source, loadEngine, workerSrc }: UsePdfDocumentOptions<V, C> & { source: PdfSource },
  control: LoadControl,
): Promise<LoadedPdf<V, C> | null> {
  const engine = await loadEngine();
  if (control.isCancelled) return null;
  if (workerSrc) engine.GlobalWorkerOptions.workerSrc = workerSrc;
  const task = engine.getDocument(toDocumentParams(source));
  control.task = task;
  const document = await task.promise;
  const pages = await Promise.all(
    Array.from({ length: document.numPages }, (_, index) => document.getPage(index + 1)),
  );
  const sizes = pages.map((page) => {
    const { width, height } = page.getViewport({ scale: 1 });
    return { width, height };
  });
  return { engine, pages, sizes, getTextContent: createTextCache(pages) };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

/**
 * Opens `source` with the injected engine and keeps it open until the source changes or the viewer
 * unmounts, when the engine's loading task (and its worker) is destroyed. A `null` source stays
 * loading. A new array is a new document.
 */
export function usePdfDocument<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfDocumentOptions<V, C>,
): PdfDocumentResult<V, C> {
  const { source } = options;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult<V, C> | null>(null);
  const latest = useLatest(options);

  useEffect(() => {
    if (source === null) return undefined;
    const control: LoadControl = { isCancelled: false, task: null };
    loadPdf({ ...latest.current, source }, control).then(
      (loaded) => {
        if (!control.isCancelled && loaded) setResult({ source, attempt, loaded });
      },
      (cause: unknown) => {
        if (control.isCancelled) return;
        setResult({ source, attempt, loaded: null });
        latest.current.onError?.(toError(cause));
      },
    );
    return () => {
      control.isCancelled = true;
      void control.task?.destroy();
    };
  }, [source, attempt, latest]);

  const current = result?.source === source && result.attempt === attempt ? result : null;
  let status: PdfDocumentStatus = 'loading';
  if (current) status = current.loaded ? 'ready' : 'error';
  return {
    status,
    loaded: current?.loaded ?? null,
    retry: () => setAttempt((count) => count + 1),
  };
}
