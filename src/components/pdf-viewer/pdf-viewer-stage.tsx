'use client';

import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ContextMenu, type ContextMenuProps } from '../context-menu/context-menu.js';
import { InlineError } from '../inline-error/inline-error.js';
import { LoadingOverlay } from '../loading-overlay/loading-overlay.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfLinks } from './use-pdf-links.js';
import type { PdfPageGeometry } from './page-geometry.js';
import type { PdfMatchRange } from './pdf-search.js';
import { PdfViewerPage } from './pdf-viewer-page.js';
import { PdfViewerPassword } from './pdf-viewer-password.js';
import { PdfViewerFrame } from './pdf-viewer-frame.js';
import type { LoadedPdf, PdfDocumentResult } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
import type { PdfSearchState } from './use-pdf-search.js';

interface PdfViewerStageProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  label: string;
  pdf: Omit<PdfDocumentResult<V, C>, 'loaded'>;
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C> | null;
  scale: number;
  pages: PdfPagesController;
  search: Pick<PdfSearchState, 'rangesByPage' | 'revealKey'>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  pagesRef: RefObject<HTMLDivElement | null>;
  menu: {
    controller: ContextMenuProps['controller'];
    onContextMenu(event: MouseEvent<HTMLElement>): void;
  };
  /** Reports a primary click on a page. */
  onPageClick(event: MouseEvent<HTMLElement>): void;
  links: Pick<PdfLinks, 'linkService' | 'followDestination' | 'goToPage'>;
  isSidebarOpen: boolean;
  onKeyDown(event: KeyboardEvent<HTMLElement>): void;
  onScrollerKeyDown(event: KeyboardEvent<HTMLElement>): void;
  renderOverlay?: ((page: PdfPageGeometry<V>) => ReactNode) | undefined;
  onPageError?: ((pageIndex: number, error: Error) => void) | undefined;
}

const noRanges: readonly PdfMatchRange[] = [];

/** What covers the stage until the document opens: the loading overlay, the error or the password. */
function PdfViewerStageCover({ pdf }: Pick<PdfViewerStageProps, 'pdf'>) {
  const strings = useUiStrings();
  const { status, password, retry } = pdf;
  if (status === 'loading') return <LoadingOverlay />;
  if (status === 'error')
    return <InlineError onRetry={retry}>{strings.documentFailed}</InlineError>;
  return password ? <PdfViewerPassword request={password} /> : null;
}

/**
 * The scrolling page column, with the sidebar beside it while open, covered by the loading overlay
 * or replaced by the error or the password prompt.
 */
export function PdfViewerStage<V extends PdfViewport, C extends PdfTextContent>({
  label,
  pdf,
  view,
  scale,
  pages,
  search,
  scrollerRef,
  pagesRef,
  menu,
  onPageClick,
  links,
  isSidebarOpen,
  onKeyDown,
  onScrollerKeyDown,
  renderOverlay,
  onPageError,
}: PdfViewerStageProps<V, C>) {
  return (
    <PdfViewerFrame
      onKeyDown={onKeyDown}
      sidebar={
        isSidebarOpen && view
          ? {
              view,
              currentPage: pages.currentPage,
              onPageChange: links.goToPage,
              followDestination: links.followDestination,
            }
          : undefined
      }
    >
      <div
        {...hooks.slot('scroller')}
        ref={scrollerRef}
        role="document"
        aria-label={label}
        // Only the document is busy: the loading overlay's status sits beside it, not inside.
        aria-busy={pdf.status === 'loading' || undefined}
        tabIndex={0}
        onScroll={pages.handleScroll}
        onKeyDown={onScrollerKeyDown}
        onContextMenu={menu.onContextMenu}
        onClick={onPageClick}
      >
        <div {...hooks.slot('pages')} ref={pagesRef} style={{ position: 'relative' }}>
          {view?.pages.map((_, pageIndex) => (
            <PdfViewerPage
              key={pageIndex}
              loaded={view}
              pageIndex={pageIndex}
              scale={scale}
              isNear={pages.nearPages?.has(pageIndex) ?? true}
              ranges={search.rangesByPage.get(pageIndex) ?? noRanges}
              revealKey={search.revealKey}
              pages={pages}
              linkService={links.linkService}
              renderOverlay={renderOverlay}
              onPageError={onPageError}
            />
          ))}
        </div>
        {/* Inside the scroller, so scrolling the document closes a menu left at the pointer. */}
        <ContextMenu controller={menu.controller} />
      </div>
      <PdfViewerStageCover pdf={pdf} />
    </PdfViewerFrame>
  );
}
