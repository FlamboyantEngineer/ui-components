import { useCallback, useEffect, useMemo } from 'react';
import { resolveDestination } from './pdf-destination.js';
import { createLinkService } from './pdf-link-service.js';
import { useLatest } from '../../utils/use-latest.js';
/**
 * Following the document's own links, outline and destinations: each is resolved against the open
 * document and carried out as a navigation request. `destination` is gone to when it changes and
 * when a document opens with it set.
 */
export function usePdfLinks(options) {
    const latest = useLatest(options);
    const followDestination = useCallback((destination) => {
        const opened = latest.current.view;
        if (!opened)
            return;
        void resolveDestination(opened, destination).then((target) => {
            if (target && latest.current.view?.document === opened.document) {
                latest.current.goTo(target);
            }
        });
    }, [latest]);
    const linkService = useMemo(() => createLinkService({
        followDestination,
        goToPage: (pageIndex) => latest.current.pages.scrollToPage(pageIndex),
        readPosition: () => ({
            currentPage: latest.current.pages.currentPage,
            pageCount: latest.current.view?.pages.length ?? 0,
        }),
    }), [followDestination, latest]);
    const { destination } = options;
    const document = options.view?.document;
    useEffect(() => {
        if (destination && document)
            followDestination(destination);
    }, [destination, document, followDestination]);
    return { linkService, followDestination };
}
//# sourceMappingURL=use-pdf-links.js.map