'use client';

import { useMemo, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { downloadPdf, printPdf, toPdfFileName } from './pdf-commands.js';
import type { PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfViewerProps } from './pdf-viewer.js';
import type { PdfCommands } from './pdf-viewer-toolbar.js';
import type { PdfSize } from './pdf-zoom.js';
import { usePdfAccess } from './use-pdf-access.js';
import { usePdfContextMenu } from './use-pdf-context-menu.js';
import { usePdfDocument, type LoadedPdf } from './use-pdf-document.js';
import { usePdfGestures } from './use-pdf-gestures.js';
import { usePdfKeyboard } from './use-pdf-keyboard.js';
import { usePdfLinks } from './use-pdf-links.js';
import { usePageViewports, usePdfNavigation } from './use-pdf-navigation.js';
import { usePdfPages } from './use-pdf-pages.js';
import { usePdfRotation } from './use-pdf-rotation.js';
import { usePdfSearch } from './use-pdf-search.js';
import { usePdfVisiblePosition } from './use-pdf-visible-position.js';
import { usePdfZoom } from './use-pdf-zoom.js';
import { usePinchZoom } from './use-pinch-zoom.js';
import { useLatest } from '../../utils/use-latest.js';

interface UsePdfCommandsOptions<V extends PdfViewport, C extends PdfTextContent> {
  view: LoadedPdf<V, C> | null;
  rotate: PdfCommands['rotate'];
  source: PdfSource | null;
  label: string;
}

const noSizes: readonly PdfSize[] = [];

/** The turned document, marked to leave its annotations undrawn when they are switched off. */
function useAnnotatedView<V extends PdfViewport, C extends PdfTextContent>(
  view: LoadedPdf<V, C> | null,
  showAnnotations: boolean,
): LoadedPdf<V, C> | null {
  return useMemo(
    () => (view && !showAnnotations ? { ...view, hidesAnnotations: true } : view),
    [view, showAnnotations],
  );
}

const ignore = () => undefined;

/** The commands of the toolbar's menu, on the open document. */
function usePdfCommands<V extends PdfViewport, C extends PdfTextContent>(
  options: UsePdfCommandsOptions<V, C>,
): PdfCommands {
  const latest = useLatest(options);
  const { rotate } = options;
  return useMemo(
    () => ({
      rotate,
      print() {
        const { view } = latest.current;
        if (view) printPdf(view).catch(ignore);
      },
      download() {
        const { view, source, label } = latest.current;
        if (view) downloadPdf(view, toPdfFileName(source, label)).catch(ignore);
      },
    }),
    [latest, rotate],
  );
}

/**
 * Everything a viewer holds: the document, its pages, zoom, rotation, find, navigation, links,
 * context menu, keyboard and commands, wired together from the viewer's props.
 */
export function usePdfViewer<V extends PdfViewport, C extends PdfTextContent>(
  props: PdfViewerProps<V, C>,
) {
  const strings = useUiStrings();
  const label = props['aria-label'] ?? strings.document;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const findFieldRef = useRef<HTMLInputElement | null>(null);
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
  const gestures = usePdfGestures({ ...props, view, scale, scrollerRef, elements: pages.elements });
  usePdfAccess({ view, onDocumentChange: props.onDocumentChange });
  usePdfVisiblePosition({
    scrollerRef,
    elements: pages.elements,
    scale,
    document: loaded,
    layout: view?.rotation,
    onVisiblePositionChange: props.onVisiblePositionChange,
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
    gestures,
    keyboard,
    commands,
    sidebar,
    refs,
  };
}
