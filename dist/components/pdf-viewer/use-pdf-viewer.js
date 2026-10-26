import { useMemo, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { downloadPdf, printPdf, toPdfFileName } from './pdf-commands.js';
import { usePdfContextMenu } from './use-pdf-context-menu.js';
import { usePdfDocument } from './use-pdf-document.js';
import { usePdfKeyboard } from './use-pdf-keyboard.js';
import { usePdfLinks } from './use-pdf-links.js';
import { usePageViewports, usePdfNavigation } from './use-pdf-navigation.js';
import { usePdfPages } from './use-pdf-pages.js';
import { usePdfRotation } from './use-pdf-rotation.js';
import { usePdfSearch } from './use-pdf-search.js';
import { usePdfZoom } from './use-pdf-zoom.js';
import { usePinchZoom } from './use-pinch-zoom.js';
import { useLatest } from '../../utils/use-latest.js';
const noSizes = [];
/** The turned document, marked to leave its annotations undrawn when they are switched off. */
function useAnnotatedView(view, showAnnotations) {
    return useMemo(() => (view && !showAnnotations ? { ...view, hidesAnnotations: true } : view), [view, showAnnotations]);
}
const ignore = () => undefined;
/** The commands of the toolbar's menu, on the open document. */
function usePdfCommands(options) {
    const latest = useLatest(options);
    const { rotate } = options;
    return useMemo(() => ({
        rotate,
        print() {
            const { view } = latest.current;
            if (view)
                printPdf(view).catch(ignore);
        },
        download() {
            const { view, source, label } = latest.current;
            if (view)
                downloadPdf(view, toPdfFileName(source, label)).catch(ignore);
        },
    }), [latest, rotate]);
}
/**
 * Everything a viewer holds: the document, its pages, zoom, rotation, find, navigation, links,
 * context menu, keyboard and commands, wired together from the viewer's props.
 */
export function usePdfViewer(props) {
    const strings = useUiStrings();
    const label = props['aria-label'] ?? strings.document;
    const scrollerRef = useRef(null);
    const pagesRef = useRef(null);
    const findFieldRef = useRef(null);
    const [isSidebarOpen, setSidebarOpen] = useState(props.defaultSidebarOpen ?? false);
    const pdf = usePdfDocument(props);
    const { status, loaded } = pdf;
    const isReady = status === 'ready';
    const pageCount = loaded?.pages.length ?? 0;
    const pages = usePdfPages({ scrollerRef, document: loaded, pageCount });
    const rotation = usePdfRotation({ loaded, pages });
    const { rotate } = rotation;
    const view = useAnnotatedView(rotation.view, props.showAnnotations ?? true);
    const defaultZoom = props.defaultZoom ?? 'page-width';
    const zoom = usePdfZoom({
        defaultZoom,
        sizes: view?.sizes ?? noSizes,
        scrollerRef,
        pagesRef,
        pages,
        onZoomChange: props.onZoomChange,
    });
    const { scale } = zoom;
    const search = usePdfSearch({ ...props, loaded, pages });
    const navigation = { ...props, document: loaded, isReady, scale, pageCount, scrollerRef, pages };
    const { goTo } = usePdfNavigation(navigation);
    usePageViewports({ ...props, loaded: view, nearPages: pages.nearPages, scale });
    const links = usePdfLinks({ view, destination: props.destination, goTo, pages });
    const menu = usePdfContextMenu({
        ...props,
        loaded: view,
        scale,
        scrollerRef,
        elements: pages.elements,
    });
    usePinchZoom({ engine: loaded?.engine ?? null, scrollerRef, pagesRef, zoom });
    const keyboard = usePdfKeyboard({ isReady, zoom, defaultZoom, pages, pageCount, findFieldRef });
    const commands = usePdfCommands({ view, rotate, source: props.source, label });
    const sidebar = { isOpen: isSidebarOpen, setOpen: setSidebarOpen };
    const refs = { scrollerRef, pagesRef, findFieldRef };
    return {
        label,
        pdf,
        view,
        isReady,
        pageCount,
        pages,
        zoom,
        search,
        links,
        menu,
        keyboard,
        commands,
        sidebar,
        refs,
    };
}
//# sourceMappingURL=use-pdf-viewer.js.map