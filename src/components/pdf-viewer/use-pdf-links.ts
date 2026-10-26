import { useCallback, useEffect, useMemo } from 'react';
import { resolveDestination, type PdfTarget } from './pdf-destination.js';
import type { PdfLinkService, PdfTextContent, PdfViewport } from './pdf-engine.js';
import { createLinkService } from './pdf-link-service.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { useLatest } from '../../utils/use-latest.js';
import type { PdfPagesController } from './use-pdf-pages.js';

interface UsePdfLinksOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C> | null;
  /** A destination the document defines, gone to each time it changes. */
  destination?: string | null | undefined;
  goTo(target: PdfTarget): void;
  pages: Pick<PdfPagesController, 'currentPage' | 'scrollToPage'>;
}

export interface PdfLinks {
  /** Follows the document's links. */
  linkService: PdfLinkService;
  /** Sends the reader to a named or explicit destination of the open document. */
  followDestination(destination: unknown): void;
}

/**
 * Following the document's own links, outline and destinations: each is resolved against the open
 * document and carried out as a navigation request. `destination` is gone to when it changes and
 * when a document opens with it set.
 */
export function usePdfLinks<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfLinksOptions<V, C>,
): PdfLinks {
  const latest = useLatest(options);
  const followDestination = useCallback(
    (destination: unknown) => {
      const opened = latest.current.view;
      if (!opened) return;
      void resolveDestination(opened, destination).then((target) => {
        if (target && latest.current.view?.document === opened.document) {
          latest.current.goTo(target);
        }
      });
    },
    [latest],
  );
  const linkService = useMemo(
    () =>
      createLinkService({
        followDestination,
        goToPage: (pageIndex) => latest.current.pages.scrollToPage(pageIndex),
        readPosition: () => ({
          currentPage: latest.current.pages.currentPage,
          pageCount: latest.current.view?.pages.length ?? 0,
        }),
      }),
    [followDestination, latest],
  );

  const { destination } = options;
  const document = options.view?.document;
  useEffect(() => {
    if (destination && document) followDestination(destination);
  }, [destination, document, followDestination]);

  return { linkService, followDestination };
}
