'use client';

import { useEffect, useState } from 'react';
import { mapBounded } from '../../utils/map-bounded.js';
import {
  toDocumentParams,
  type PdfDocument,
  type PdfDocumentOptions,
  type PdfEngine,
  type PdfLoadingTask,
  type PdfOutlineNode,
  type PdfPage,
  type PdfSource,
  type PdfTextContent,
  type PdfViewport,
} from './pdf-engine.js';
import type { PdfSize } from './pdf-zoom.js';
import { useLatest } from '../../utils/use-latest.js';

type PdfDocumentStatus = 'loading' | 'password' | 'ready' | 'error';

/** An opened document: the engine that opened it, its pages and their text. */
export interface LoadedPdf<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  engine: PdfEngine<V, C>;
  document: PdfDocument<V, C>;
  pages: PdfPage<V, C>[];
  /** The outline's top-level entries; empty when the document has none. */
  outline: PdfOutlineNode[];
  /** The reader's rotation of every page, in degrees clockwise. */
  rotation: number;
  /** Leaves the pages' annotations and links undrawn (UIC-PDF-VIEWER-2.5). */
  hidesAnnotations?: boolean | undefined;
  /** Each page's size at 100% zoom and the reader's rotation, in points. */
  sizes: PdfSize[];
  /** A page's text content, fetched once and shared by its text layer and the search. */
  getTextContent(pageIndex: number): Promise<C>;
  /** A page's viewport at a scale, shared by everything drawn at that scale. */
  getViewport(pageIndex: number, scale: number): V | undefined;
}

interface UsePdfDocumentOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  source: PdfSource | null;
  loadEngine: () => Promise<PdfEngine<V, C>>;
  workerSrc?: string | undefined;
  documentOptions?: PdfDocumentOptions | undefined;
  onError?: ((error: Error) => void) | undefined;
}

/** The engine waits for the document's password. */
export interface PdfPasswordRequest {
  /** How many passwords the engine has turned down. */
  failures: number;
  /** A submitted password is being checked. */
  isChecking: boolean;
  submit(password: string): void;
}

export interface PdfDocumentResult<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  status: PdfDocumentStatus;
  loaded: LoadedPdf<V, C> | null;
  password: PdfPasswordRequest | null;
  retry(): void;
}

interface LoadControl {
  isCancelled: boolean;
  task: Pick<PdfLoadingTask, 'destroy'> | null;
  onPassword(update: (password: string) => void, isIncorrect: boolean): void;
}

/** The load an outcome belongs to: a source, and how many times it was retried. */
interface LoadKey {
  source: PdfSource;
  attempt: number;
}

/** The outcome of one load: the opened document, or `null` when it could not be opened. */
interface LoadResult<V extends PdfViewport, C extends PdfTextContent> extends LoadKey {
  loaded: LoadedPdf<V, C> | null;
}

type PasswordState = LoadKey & PdfPasswordRequest;

/** How many page or text requests the viewer keeps in flight at once (UIC-PDF-VIEWER-1.7). */
export const pdfRequestLimit = 8;

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
  { source, loadEngine, workerSrc, documentOptions }: UsePdfDocumentOptions<V, C> & LoadKey,
  control: LoadControl,
): Promise<LoadedPdf<V, C> | null> {
  const engine = await loadEngine();
  if (control.isCancelled) return null;
  if (workerSrc) engine.GlobalWorkerOptions.workerSrc = workerSrc;
  const task = engine.getDocument({ ...documentOptions, ...toDocumentParams(source) });
  control.task = task;
  task.onPassword = (update: (password: string) => void, reason: number) =>
    control.onPassword(update, reason === engine.PasswordResponses.INCORRECT_PASSWORD);
  const document = await task.promise;
  const [pages, outline] = await Promise.all([
    mapBounded(document.numPages, (index) => document.getPage(index + 1), {
      limit: pdfRequestLimit,
      isCancelled: () => control.isCancelled,
    }),
    document.getOutline().catch(() => null),
  ]);
  if (control.isCancelled) return null;
  const sizes = pages.map((page) => {
    const { width, height } = page.getViewport({ scale: 1 });
    return { width, height };
  });
  return {
    engine,
    document,
    pages,
    outline: outline ?? [],
    rotation: 0,
    sizes,
    getTextContent: createTextCache(pages),
    getViewport: createViewportCache(pages, 0),
  };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

/** A URL object as its text, so a new `URL` for the same address is the same document. */
function toLoadSource(source: PdfSource | null): PdfSource | null {
  return source instanceof URL ? source.href : source;
}

function isCurrent(key: LoadKey | null, source: PdfSource | null, attempt: number): boolean {
  return key?.source === source && key.attempt === attempt;
}

/** The password request of a load: counts the passwords turned down and marks one being checked. */
function createPasswordHandler(
  key: LoadKey,
  control: Pick<LoadControl, 'isCancelled'>,
  setPassword: (update: (previous: PasswordState | null) => PasswordState | null) => void,
): LoadControl['onPassword'] {
  let failures = 0;
  return (update, isIncorrect) => {
    if (control.isCancelled) return;
    if (isIncorrect) failures += 1;
    const submit = (password: string) => {
      setPassword((previous) => previous && { ...previous, isChecking: true });
      update(password);
    };
    setPassword(() => ({ ...key, failures, isChecking: false, submit }));
  };
}

/** The rotation a page shows at: its own, turned further by the reader's, in degrees. */
export function toPageRotation(page: Pick<PdfPage, 'rotate'>, rotation: number): number {
  return (((page.rotate + rotation) % 360) + 360) % 360;
}

/**
 * Viewports at the reader's rotation. Only the applied scale is worth keeping: every part of a page
 * asks for the same one.
 */
export function createViewportCache<V extends PdfViewport, C extends PdfTextContent>(
  pages: readonly PdfPage<V, C>[],
  rotation: number,
): LoadedPdf<V, C>['getViewport'] {
  const cache = new Map<number, V>();
  let cachedScale = Number.NaN;
  return (pageIndex, scale) => {
    if (scale !== cachedScale) {
      cache.clear();
      cachedScale = scale;
    }
    const page = pages[pageIndex];
    const viewport =
      cache.get(pageIndex) ??
      page?.getViewport({ scale, rotation: toPageRotation(page, rotation) });
    if (viewport) cache.set(pageIndex, viewport);
    return viewport;
  };
}

/**
 * Opens `source` with the injected engine and keeps it open until the source changes or the viewer
 * unmounts, when the engine's loading task (and its worker) is destroyed. A `null` source stays
 * loading. A new array is a new document; a URL, as text or a `URL`, is the same document while its
 * address is. A document that needs its password waits for it. Each source and retry is a new
 * document lifetime: what an earlier lifetime opened or asked is dropped as it ends, so a document
 * the viewer returns to loads again rather than showing one already destroyed.
 */
export function usePdfDocument<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfDocumentOptions<V, C>,
): PdfDocumentResult<V, C> {
  const source = toLoadSource(options.source);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult<V, C> | null>(null);
  const [password, setPassword] = useState<PasswordState | null>(null);
  const latest = useLatest(options);
  const [lifetime, setLifetime] = useState({ source, attempt });
  if (lifetime.source !== source || lifetime.attempt !== attempt) {
    setLifetime({ source, attempt });
    setResult(null);
    setPassword(null);
  }

  useEffect(() => {
    if (source === null) return undefined;
    const key = { source, attempt };
    const control: LoadControl = { isCancelled: false, task: null, onPassword: () => undefined };
    control.onPassword = createPasswordHandler(key, control, setPassword);
    loadPdf({ ...latest.current, ...key }, control).then(
      (loaded) => {
        if (!control.isCancelled && loaded) setResult({ ...key, loaded });
      },
      (cause: unknown) => {
        if (control.isCancelled) return;
        setResult({ ...key, loaded: null });
        latest.current.onError?.(toError(cause));
      },
    );
    return () => {
      control.isCancelled = true;
      void control.task?.destroy();
    };
  }, [source, attempt, latest]);

  const current = isCurrent(result, source, attempt) ? result : null;
  const request = !current && isCurrent(password, source, attempt) ? password : null;
  let status: PdfDocumentStatus = request ? 'password' : 'loading';
  if (current) status = current.loaded ? 'ready' : 'error';
  return {
    status,
    loaded: current?.loaded ?? null,
    password: request,
    retry: () => setAttempt((count) => count + 1),
  };
}
