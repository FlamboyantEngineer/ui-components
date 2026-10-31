// The part of the PDF engine (pdf.js) the viewer drives, described structurally so the library never
// imports the engine: the host injects it, and the `pdfjs-dist` module satisfies these types.

/** A document to open: its URL, or its bytes when the caller already holds the file. */
export type PdfSource = string | URL | ArrayBuffer | Uint8Array;

/**
 * Options the engine opens a document with: request headers and credentials for a URL, and where
 * it finds the character maps and standard fonts that some documents need.
 */
export interface PdfDocumentOptions {
  /** Headers sent with the requests for a URL source. */
  httpHeaders?: Record<string, string> | undefined;
  /** Sends cookies and credentials with cross-origin requests for a URL source. */
  withCredentials?: boolean | undefined;
  /** The folder of the engine's character maps, with a trailing slash. */
  cMapUrl?: string | undefined;
  /** Whether those character maps are the engine's packed ones. */
  cMapPacked?: boolean | undefined;
  /** The folder of the engine's standard font data, with a trailing slash. */
  standardFontDataUrl?: string | undefined;
}

/** What the engine is asked to open. */
export type PdfDocumentParams = ({ url: string } | { data: Uint8Array }) & PdfDocumentOptions;

export interface PdfViewport {
  width: number;
  height: number;
  scale: number;
}

export interface PdfTextItem {
  str: string;
  hasEOL: boolean;
}

/** A page's text runs, interleaved with marked-content boundaries that carry no text. */
export interface PdfTextContent {
  items: ReadonlyArray<PdfTextItem | { type: string }>;
}

export interface PdfRenderTask {
  promise: Promise<void>;
  cancel(): void;
}

export interface PdfRenderParams {
  canvas: HTMLCanvasElement | null;
  viewport: PdfViewport;
  transform?: number[] | undefined;
  annotationMode?: number | undefined;
}

/** An indirect reference to a page, as explicit destinations hold them. */
export interface PdfRef {
  num: number;
  gen: number;
}

/** One entry of a document's outline (its bookmarks). */
export interface PdfOutlineNode {
  title: string;
  /** A named destination, an explicit one, or none. */
  dest: string | unknown[] | null;
  /** A web address the entry opens instead. */
  url: string | null;
  /** Positive when the entry starts expanded. */
  count?: number | undefined;
  items: PdfOutlineNode[];
}

// The engine's text layer reads back the viewport and text content its pages produced, so those two
// types are parameters: the engine module is then inferred exactly instead of adapted.

export interface PdfPage<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  /** Degrees the page itself turns clockwise. */
  readonly rotate: number;
  /** The page's visible box in user space, `[left, bottom, right, top]`. */
  readonly view: number[];
  getViewport(params: { scale: number; rotation?: number }): Viewport;
  render(params: PdfRenderParams): PdfRenderTask;
  getTextContent(): Promise<Content>;
  getAnnotations(params: { intent: 'display' | 'print' }): Promise<unknown[]>;
}

export interface PdfDocument<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage<Viewport, Content>>;
  /** The outline, or `null` when the document has none. */
  getOutline(): Promise<PdfOutlineNode[] | null>;
  /** The explicit destination a name stands for, or `null`. */
  getDestination(name: string): Promise<unknown[] | null>;
  /** The zero-based index of the page a reference points to. */
  getPageIndex(ref: PdfRef): Promise<number>;
  /** The document's bytes. */
  getData(): Promise<Uint8Array>;
}

export interface PdfLoadingTask<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  promise: Promise<PdfDocument<Viewport, Content>>;
  destroy(): Promise<void>;
  /**
   * Called with a function taking the password and a `PasswordResponses` reason when the document
   * needs its password. The engine declares it as a bare `Function`, so the viewer only writes it.
   */
  onPassword: unknown;
}

/** The engine's text layer: transparent, selectable runs laid over a rendered page. */
export interface PdfTextLayer {
  render(): Promise<void>;
  cancel(): void;
  /** One element per text run, in the order of the text content's runs. */
  readonly textDivs: HTMLElement[];
  readonly textContentItemsStr: string[];
}

export interface PdfTextLayerOptions<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  textContentSource: Content;
  container: HTMLElement;
  viewport: Viewport;
}

/** What the engine's annotation layer asks of the viewer when a link is drawn or followed. */
export interface PdfLinkService {
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
  getDestinationHash(destination: unknown): string;
  getAnchorUrl(hash: string): string;
  goToDestination(destination: unknown): void;
  executeNamedAction(action: string): void;
  executeSetOCGState(action: unknown): void;
}

export interface PdfAnnotationLayerOptions<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  div: HTMLDivElement;
  page: PdfPage<Viewport, Content>;
  viewport: Viewport;
  linkService: PdfLinkService;
  // The engine's viewer features the library does not use.
  accessibilityManager: null;
  annotationCanvasMap: null;
  annotationEditorUIManager: null;
  annotationStorage: null;
  commentManager: null;
  structTreeLayer: null;
}

export interface PdfAnnotationLayerParams<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  annotations: unknown[];
  viewport: Viewport;
  div: HTMLDivElement;
  page: PdfPage<Viewport, Content>;
  linkService: PdfLinkService;
  renderForms: boolean;
}

/** The engine's annotation layer: links and annotations as elements over a rendered page. */
export interface PdfAnnotationLayer<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  render(params: PdfAnnotationLayerParams<Viewport, Content>): Promise<void>;
  destroy(): void;
}

export interface PdfTouchManagerOptions {
  container: HTMLElement;
  signal: AbortSignal;
  /** Called with the gesture's previous centre, and the previous and current finger spans. */
  onPinching(origin: number[], previousDistance: number, distance: number): void;
  onPinchEnd(): void;
  /** Called with the movement of a two-finger drag that does not pinch. */
  onPanning(deltaX: number, deltaY: number): void;
}

export interface PdfEngine<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  getDocument(params: PdfDocumentParams): PdfLoadingTask<Viewport, Content>;
  GlobalWorkerOptions: { workerSrc: string };
  TextLayer: new (options: PdfTextLayerOptions<Viewport, Content>) => PdfTextLayer;
  AnnotationLayer: new (
    options: PdfAnnotationLayerOptions<Viewport, Content>,
  ) => PdfAnnotationLayer<Viewport, Content>;
  /** Tells two-finger pinches and drags apart on a touch screen. */
  TouchManager: new (options: PdfTouchManagerOptions) => { destroy(): void };
  AnnotationMode: { DISABLE: number; ENABLE: number };
  PasswordResponses: { NEED_PASSWORD: number; INCORRECT_PASSWORD: number };
}

/**
 * The engine parameters for a source. Bytes are copied, because the engine transfers the buffer it
 * is given to its worker, which would leave the caller's array empty.
 */
export function toDocumentParams(source: PdfSource): PdfDocumentParams {
  if (typeof source === 'string') return { url: source };
  if (source instanceof URL) return { url: source.href };
  return { data: source instanceof Uint8Array ? source.slice() : new Uint8Array(source.slice(0)) };
}

export function isTextItem(item: PdfTextItem | { type: string }): item is PdfTextItem {
  return 'str' in item;
}

/** The engine's text layer for a page. */
export function createTextLayer<V extends PdfViewport, C extends PdfTextContent>(
  engine: PdfEngine<V, C>,
  options: PdfTextLayerOptions<V, C>,
): PdfTextLayer {
  return new engine.TextLayer(options);
}

/** The engine's annotation layer for a page, with the viewer features the library leaves out. */
export function createAnnotationLayer<V extends PdfViewport, C extends PdfTextContent>(
  engine: PdfEngine<V, C>,
  options: Pick<PdfAnnotationLayerOptions<V, C>, 'div' | 'page' | 'viewport' | 'linkService'>,
): PdfAnnotationLayer<V, C> {
  return new engine.AnnotationLayer({
    ...options,
    accessibilityManager: null,
    annotationCanvasMap: null,
    annotationEditorUIManager: null,
    annotationStorage: null,
    commentManager: null,
    structTreeLayer: null,
  });
}
