import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { ContextMenu } from '../context-menu/context-menu.js';
import { InlineError } from '../inline-error/inline-error.js';
import { LoadingOverlay } from '../loading-overlay/loading-overlay.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { PdfViewerPage } from './pdf-viewer-page.js';
import { PdfViewerPassword } from './pdf-viewer-password.js';
import { PdfViewerSidebar } from './pdf-viewer-sidebar.js';
const noRanges = [];
/** What covers the stage until the document opens: the loading overlay, the error or the password. */
function PdfViewerStageCover({ pdf }) {
    const strings = useUiStrings();
    const { status, password, retry } = pdf;
    if (status === 'loading')
        return _jsx(LoadingOverlay, {});
    if (status === 'error')
        return _jsx(InlineError, { onRetry: retry, children: strings.documentFailed });
    return password ? _jsx(PdfViewerPassword, { request: password }) : null;
}
/**
 * The scrolling page column, with the sidebar beside it while open, covered by the loading overlay
 * or replaced by the error or the password prompt.
 */
export function PdfViewerStage({ label, pdf, view, scale, pages, search, scrollerRef, pagesRef, menu, links, isSidebarOpen, onKeyDown, onScrollerKeyDown, renderOverlay, }) {
    return (_jsxs("div", { ...hooks.slot('stage'), style: { position: 'relative' }, onKeyDown: onKeyDown, children: [isSidebarOpen && view ? (_jsx(PdfViewerSidebar, { view: view, currentPage: pages.currentPage, onPageChange: pages.scrollToPage, followDestination: links.followDestination })) : null, _jsxs("div", { ...hooks.slot('scroller'), ref: scrollerRef, role: "document", "aria-label": label, tabIndex: 0, onScroll: pages.handleScroll, onKeyDown: onScrollerKeyDown, onContextMenu: menu.onContextMenu, children: [_jsx("div", { ...hooks.slot('pages'), ref: pagesRef, style: { position: 'relative' }, children: view?.pages.map((_, pageIndex) => (_jsx(PdfViewerPage, { loaded: view, pageIndex: pageIndex, scale: scale, isNear: pages.nearPages?.has(pageIndex) ?? true, ranges: search.rangesByPage.get(pageIndex) ?? noRanges, revealKey: search.revealKey, pages: pages, linkService: links.linkService, renderOverlay: renderOverlay }, pageIndex))) }), _jsx(ContextMenu, { controller: menu.controller })] }), _jsx(PdfViewerStageCover, { pdf: pdf })] }));
}
//# sourceMappingURL=pdf-viewer-stage.js.map