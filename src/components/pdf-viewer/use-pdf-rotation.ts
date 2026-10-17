import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import { createViewportCache, type LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';

export interface UsePdfRotationOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  loaded: LoadedPdf<V, C> | null;
  pages: Pick<PdfPagesController, 'captureAnchor' | 'restoreAnchor'>;
}

export interface PdfRotationState<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C> | null;
  /** Turns every page a quarter turn clockwise (90) or counterclockwise (-90). */
  rotate(degrees: 90 | -90): void;
}

/** The document turned by `rotation` degrees clockwise: a quarter turn swaps each page's sides. */
export function rotatePdf<V extends PdfViewport, C extends PdfTextContent>(
  loaded: LoadedPdf<V, C>,
  rotation: number,
): LoadedPdf<V, C> {
  if (rotation === loaded.rotation) return loaded;
  const isQuarterTurn = (rotation - loaded.rotation) % 180 !== 0;
  return {
    ...loaded,
    rotation,
    sizes: isQuarterTurn
      ? loaded.sizes.map(({ width, height }) => ({ width: height, height: width }))
      : loaded.sizes,
    getViewport: createViewportCache(loaded.pages, rotation),
  };
}

/**
 * The reader's rotation of the pages, keeping their place across a turn. A new document starts
 * as the document itself sets each page.
 */
export function usePdfRotation<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pages,
}: UsePdfRotationOptions<V, C>): PdfRotationState<V, C> {
  const { captureAnchor, restoreAnchor } = pages;
  const [turn, setTurn] = useState({ loaded, rotation: 0 });
  const rotation = turn.loaded === loaded ? turn.rotation : 0;
  const view = useMemo(() => loaded && rotatePdf(loaded, rotation), [loaded, rotation]);
  const rotate = useCallback(
    (degrees: 90 | -90) => {
      captureAnchor();
      setTurn((previous) => ({
        loaded,
        rotation: ((previous.loaded === loaded ? previous.rotation : 0) + degrees + 360) % 360,
      }));
    },
    [captureAnchor, loaded],
  );
  useLayoutEffect(() => restoreAnchor(), [rotation, restoreAnchor]);
  return { view, rotate };
}
