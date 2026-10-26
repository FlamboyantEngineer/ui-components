// The part of the PDF engine (pdf.js) the viewer drives, described structurally so the library never
// imports the engine: the host injects it, and the `pdfjs-dist` module satisfies these types.
/**
 * The engine parameters for a source. Bytes are copied, because the engine transfers the buffer it
 * is given to its worker, which would leave the caller's array empty.
 */
export function toDocumentParams(source) {
    if (typeof source === 'string')
        return { url: source };
    if (source instanceof URL)
        return { url: source.href };
    return { data: source instanceof Uint8Array ? source.slice() : new Uint8Array(source.slice(0)) };
}
export function isTextItem(item) {
    return 'str' in item;
}
/** The engine's text layer for a page. */
export function createTextLayer(engine, options) {
    return new engine.TextLayer(options);
}
/** The engine's annotation layer for a page, with the viewer features the library leaves out. */
export function createAnnotationLayer(engine, options) {
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
//# sourceMappingURL=pdf-engine.js.map