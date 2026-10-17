import type { RefObject } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { InlineError } from '../inline-error/inline-error.js';
import { LoadingOverlay } from '../loading-overlay/loading-overlay.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfMatchRange } from './pdf-search.js';
import { PdfViewerPage } from './pdf-viewer-page.js';
import type { PdfDocumentResult } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
import type { PdfSearchState } from './use-pdf-search.js';

export interface PdfViewerStageProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  label: string;
  pdf: PdfDocumentResult<V, C>;
  scale: number;
  pages: PdfPagesController;
  search: Pick<PdfSearchState, 'rangesByPage' | 'revealKey'>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  pagesRef: RefObject<HTMLDivElement | null>;
}

const noRanges: readonly PdfMatchRange[] = [];

/** The scrolling page column, covered by the loading overlay or replaced by the error. */
export function PdfViewerStage<V extends PdfViewport, C extends PdfTextContent>({
  label,
  pdf,
  scale,
  pages,
  search,
  scrollerRef,
  pagesRef,
}: PdfViewerStageProps<V, C>) {
  const strings = useUiStrings();
  const { status, loaded, retry } = pdf;
  return (
    <div {...hooks.slot('stage')} style={{ position: 'relative' }}>
      <div
        {...hooks.slot('scroller')}
        ref={scrollerRef}
        role="document"
        aria-label={label}
        tabIndex={0}
        onScroll={pages.handleScroll}
      >
        <div {...hooks.slot('pages')} ref={pagesRef} style={{ position: 'relative' }}>
          {loaded?.pages.map((_, pageIndex) => (
            <PdfViewerPage
              key={pageIndex}
              loaded={loaded}
              pageIndex={pageIndex}
              scale={scale}
              isNear={pages.nearPages?.has(pageIndex) ?? true}
              ranges={search.rangesByPage.get(pageIndex) ?? noRanges}
              revealKey={search.revealKey}
              pages={pages}
            />
          ))}
        </div>
      </div>
      {status === 'loading' ? <LoadingOverlay /> : null}
      {status === 'error' ? (
        <InlineError onRetry={retry}>{strings.documentFailed}</InlineError>
      ) : null}
    </div>
  );
}
