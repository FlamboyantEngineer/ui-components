import { useMemo } from 'react';
import type { PdfLinkService } from './pdf-engine.js';
import { mergeSafeRel } from '../../utils/merge-safe-rel.js';

interface LinkServiceActions {
  /** Sends the reader to a destination of the document. */
  followDestination(destination: unknown): void;
  /** Sends the reader to a page, zero-based. */
  goToPage(pageIndex: number): void;
  /** The page the reader is on and the number of pages. */
  readPosition(): { currentPage: number; pageCount: number };
}

/** The page a named navigation action of the document leads to, or `null` for another action. */
export function resolveNamedAction(
  action: string,
  { currentPage, pageCount }: { currentPage: number; pageCount: number },
): number | null {
  switch (action) {
    case 'NextPage':
      return Math.min(currentPage + 1, pageCount - 1);
    case 'PrevPage':
      return Math.max(currentPage - 1, 0);
    case 'FirstPage':
      return 0;
    case 'LastPage':
      return pageCount - 1;
    default:
      return null;
  }
}

/**
 * What the engine's annotation layer calls when it draws and follows links. Links to the web open
 * in a new tab, so the reader never leaves the screen the viewer is on; links inside the document
 * move the viewer instead of the browser.
 */
export function createLinkService(actions: LinkServiceActions): PdfLinkService {
  return {
    addLinkAttributes(link, url) {
      link.href = url;
      link.title = url;
      link.target = '_blank';
      // Links in a document are the author's, not this site's: search engines do not follow them.
      link.rel = mergeSafeRel(link.target, 'nofollow') ?? '';
    },
    getDestinationHash: (destination) =>
      typeof destination === 'string' && destination ? `#${encodeURIComponent(destination)}` : '#',
    getAnchorUrl: (hash) => hash || '#',
    goToDestination: (destination) => actions.followDestination(destination),
    executeNamedAction(action) {
      const pageIndex = resolveNamedAction(action, actions.readPosition());
      if (pageIndex !== null) actions.goToPage(pageIndex);
    },
    // Optional content (layers) shows as the document sets it.
    executeSetOCGState: () => undefined,
  };
}

/** The link service carrying out the viewer's actions, the same while the actions stay the same. */
export function useLinkService({
  followDestination,
  goToPage,
  readPosition,
}: LinkServiceActions): PdfLinkService {
  return useMemo(
    () => createLinkService({ followDestination, goToPage, readPosition }),
    [followDestination, goToPage, readPosition],
  );
}
