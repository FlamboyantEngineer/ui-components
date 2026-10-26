import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { measuredProperty } from '../../core/hooks.js';
import { ProjectionContent } from '../projection/projection.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { PdfViewerStage } from './pdf-viewer-stage.js';
import { PdfViewerToolbar } from './pdf-viewer-toolbar.js';
import { usePdfViewer } from './use-pdf-viewer.js';
export { findBoxAtPoint } from './page-geometry.js';
/**
 * A PDF reader: pages drawn on canvas with selectable text and working links, zoom with fit modes,
 * rotation, page navigation, a sidebar of thumbnails and outline, find, printing and saving, and a
 * context menu, over a PDF engine the host injects, with caller content over the pages.
 */
export function PdfViewer(props) {
    const { className, id, toolbarSlot } = props;
    const viewer = usePdfViewer(props);
    const { pdf, pages, zoom, search, keyboard, refs } = viewer;
    const toolbar = (_jsx(PdfViewerToolbar, { label: viewer.label, isReady: viewer.isReady, zoom: zoom, pageCount: viewer.pageCount, currentPage: pages.currentPage, onPageChange: pages.scrollToPage, search: search, findFieldRef: refs.findFieldRef, sidebar: viewer.sidebar, commands: viewer.commands, onKeyDown: keyboard.onViewerKeyDown, actions: props.actions, leadingActions: props.leadingActions, renderSearch: props.renderSearch }));
    return (_jsxs("div", { ...hooks.root({
            className,
            props,
            data: {
                loading: pdf.status === 'loading',
                locked: pdf.status === 'password',
                error: pdf.status === 'error',
            },
        }), id: id, "aria-busy": pdf.status === 'loading' || undefined, style: measuredProperty('pdf-viewer-scale', String(zoom.scale)), children: [toolbarSlot ? _jsx(ProjectionContent, { slot: toolbarSlot, children: toolbar }) : toolbar, _jsx(PdfViewerStage, { label: viewer.label, pdf: pdf, view: viewer.view, scale: zoom.scale, pages: pages, search: search, scrollerRef: refs.scrollerRef, pagesRef: refs.pagesRef, menu: viewer.menu, links: viewer.links, isSidebarOpen: viewer.sidebar.isOpen, onKeyDown: keyboard.onViewerKeyDown, onScrollerKeyDown: keyboard.onScrollerKeyDown, renderOverlay: props.renderPageOverlay })] }));
}
//# sourceMappingURL=pdf-viewer.js.map