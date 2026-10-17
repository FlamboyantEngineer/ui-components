// The part of the PDF engine (pdf.js) the viewer drives, described structurally so the library never
// imports the engine: the host injects it, and the `pdfjs-dist` module satisfies these types.

/** A document to open: its URL, or its bytes when the caller already holds the file. */
export type PdfSource = string | URL | ArrayBuffer | Uint8Array;

/** What the engine is asked to open. */
export type PdfDocumentParams = { url: string } | { data: Uint8Array };

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

// The engine's text layer reads back the viewport and text content its pages produced, so those two
// types are parameters: the engine module is then inferred exactly instead of adapted.

export interface PdfPage<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  getViewport(params: { scale: number }): Viewport;
  render(params: PdfRenderParams): PdfRenderTask;
  getTextContent(): Promise<Content>;
}

export interface PdfDocument<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage<Viewport, Content>>;
}

export interface PdfLoadingTask<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  promise: Promise<PdfDocument<Viewport, Content>>;
  destroy(): Promise<void>;
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

export interface PdfEngine<
  Viewport extends PdfViewport = PdfViewport,
  Content extends PdfTextContent = PdfTextContent,
> {
  getDocument(params: PdfDocumentParams): PdfLoadingTask<Viewport, Content>;
  GlobalWorkerOptions: { workerSrc: string };
  TextLayer: new (options: PdfTextLayerOptions<Viewport, Content>) => PdfTextLayer;
  AnnotationMode: { DISABLE: number };
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
