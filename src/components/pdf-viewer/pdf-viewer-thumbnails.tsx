'use client';

import { type RefObject, useCallback, useEffect, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ListBox, ListBoxItem, type Selection } from '../../primitives/index.js';
import { useDevicePixelRatio } from '../../utils/use-device-pixel-ratio.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { capCanvasPixels, drawPage } from './page-bitmap.js';
import { toPageRotation } from './page-geometry.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { type NearPages, useNearPages } from './use-near-pages.js';
import type { LoadedPdf } from './use-pdf-document.js';

interface PdfViewerThumbnailsProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C>;
  currentPage: number;
  onPageChange(pageIndex: number): void;
  scrollerRef: RefObject<HTMLElement | null>;
}

interface PdfThumbnailProps<V extends PdfViewport, C extends PdfTextContent> {
  view: LoadedPdf<V, C>;
  pageIndex: number;
  isNear: boolean;
  registerPage: NearPages['registerPage'];
}

const noSize = { width: 0, height: 0 };

function readSelectedPage(keys: Selection): number | null {
  if (keys === 'all') return null;
  const [key] = keys;
  return typeof key === 'number' ? key : null;
}

/**
 * One page drawn as wide as its item, and only while the item is within a sidebar's height of the
 * view. The stylesheet sizes the item; the canvas follows it.
 */
function PdfThumbnailCanvas<V extends PdfViewport, C extends PdfTextContent>({
  view,
  pageIndex,
  isNear,
  registerPage,
}: PdfThumbnailProps<V, C>) {
  // The item mounts with the canvas, inside React Aria's collection, so both are held in state.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const attachCanvas = useCallback(
    (element: HTMLCanvasElement | null) => {
      setCanvas(element);
      registerPage(pageIndex, element?.parentElement ?? null);
    },
    [pageIndex, registerPage],
  );
  const width = useElementSize(canvas?.parentElement)?.width ?? 0;
  const page = view.sizes[pageIndex] ?? noSize;
  const height = page.width > 0 ? (width * page.height) / page.width : 0;
  const ratio = useDevicePixelRatio(canvas);
  const pixels = isNear ? capCanvasPixels(width, height, ratio) : noSize;

  useEffect(() => {
    const pdfPage = view.pages[pageIndex];
    if (!canvas || !pdfPage || pixels.width === 0 || page.width === 0) return undefined;
    const rotation = toPageRotation(pdfPage, view.rotation);
    const viewport = pdfPage.getViewport({ scale: width / page.width, rotation });
    return drawPage({ loaded: view, page: pdfPage, viewport }, canvas);
  }, [canvas, page.width, pageIndex, pixels.height, pixels.width, view, width]);

  return (
    <canvas
      {...hooks.slot('thumbnail-canvas')}
      ref={attachCanvas}
      width={pixels.width}
      height={pixels.height}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** The pages as thumbnails, the current one selected; choosing one goes to its page. */
export function PdfViewerThumbnails<V extends PdfViewport, C extends PdfTextContent>({
  view,
  currentPage,
  onPageChange,
  scrollerRef,
}: PdfViewerThumbnailsProps<V, C>) {
  const strings = useUiStrings();
  const { nearPages, registerPage } = useNearPages(scrollerRef);
  return (
    <ListBox
      aria-label={strings.pages}
      className={hooks.slotClass('thumbnails')}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[currentPage]}
      onSelectionChange={(keys) => {
        const pageIndex = readSelectedPage(keys);
        if (pageIndex !== null) onPageChange(pageIndex);
      }}
    >
      {view.pages.map((_, pageIndex) => (
        <ListBoxItem
          key={pageIndex}
          id={pageIndex}
          textValue={strings.pageNumber(pageIndex + 1)}
          aria-label={strings.pageNumber(pageIndex + 1)}
          className={hooks.slotClass('thumbnail')}
        >
          <PdfThumbnailCanvas
            view={view}
            pageIndex={pageIndex}
            isNear={nearPages?.has(pageIndex) ?? false}
            registerPage={registerPage}
          />
          <span {...hooks.slot('thumbnail-label')}>{pageIndex + 1}</span>
        </ListBoxItem>
      ))}
    </ListBox>
  );
}
