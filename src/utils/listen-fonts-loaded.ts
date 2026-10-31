/**
 * Calls `onLoaded` whenever fonts finish loading in `element`'s document, which changes text
 * metrics without resizing a box of fixed size. Returns the unsubscription; a document without
 * `fonts` never calls it.
 */
export function listenFontsLoaded(element: Element, onLoaded: () => void): () => void {
  const fonts = element.ownerDocument.fonts as FontFaceSet | undefined;
  fonts?.addEventListener('loadingdone', onLoaded);
  return () => fonts?.removeEventListener('loadingdone', onLoaded);
}
