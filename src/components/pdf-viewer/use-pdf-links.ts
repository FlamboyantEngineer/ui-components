'use client';

import { useCallback, useEffect, useRef } from 'react';
import { resolveDestination } from './pdf-destination.js';
import type { PdfLinkService, PdfTextContent, PdfViewport } from './pdf-engine.js';
import { useLinkService } from './pdf-link-service.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { useLatest } from '../../utils/use-latest.js';
import type { PdfNavigationOrder } from './use-pdf-navigation.js';
import type { PdfPagesController } from './use-pdf-pages.js';

interface UsePdfLinksOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C> | null;
  /** A destination the document defines, gone to each time it changes. */
  destination?: string | null | undefined;
  /** The viewer's order of navigation requests. */
  navigation: PdfNavigationOrder;
  pages: Pick<PdfPagesController, 'currentPage' | 'scrollToPage'>;
}

export interface PdfLinks {
  /** Follows the document's links. */
  linkService: PdfLinkService;
  /** Sends the reader to a named or explicit destination of the open document. */
  followDestination(destination: unknown): void;
  /** Sends the reader to a page, zero-based, superseding a destination still being looked up. */
  goToPage(pageIndex: number): void;
}

/**
 * Following the document's own links, outline and destinations: each is resolved against the open
 * document and carried out as a navigation request. `destination` is gone to when it changes and
 * when a document opens with it set. Only the latest request counts: a destination still being
 * looked up is dropped once any newer navigation starts (another destination, the reader going to
 * a page, the caller's `page` or `revealRect`, find or another document) or `destination` is
 * cleared.
 */
export function usePdfLinks<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfLinksOptions<V, C>,
): PdfLinks {
  const latestRef = useLatest(options);
  const followDestination = useCallback(
    (destination: unknown) => {
      const opened = latestRef.current.view;
      if (!opened) return;
      const ticket = latestRef.current.navigation.startRequest();
      void resolveDestination(opened, destination).then((target) => {
        const { view, navigation } = latestRef.current;
        if (target && view?.document === opened.document) navigation.goTo(target, ticket);
      });
    },
    [latestRef],
  );
  const goToPage = useCallback(
    (pageIndex: number) => {
      latestRef.current.navigation.startRequest();
      latestRef.current.pages.scrollToPage(pageIndex);
    },
    [latestRef],
  );
  const readPosition = useCallback(
    () => ({
      currentPage: latestRef.current.pages.currentPage,
      pageCount: latestRef.current.view?.pages.length ?? 0,
    }),
    [latestRef],
  );
  const linkService = useLinkService({ followDestination, goToPage, readPosition });

  const { destination } = options;
  const document = options.view?.document;
  const wasSet = useRef(false);
  useEffect(() => {
    if (destination && document) followDestination(destination);
    // Clearing the destination drops its lookup.
    else if (wasSet.current && !destination) latestRef.current.navigation.startRequest();
    wasSet.current = Boolean(destination);
  }, [destination, document, followDestination, latestRef]);

  return { linkService, followDestination, goToPage };
}
