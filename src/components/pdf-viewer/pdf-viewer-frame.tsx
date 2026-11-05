'use client';

import { type KeyboardEvent, type ReactNode, useId, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { ResizeHandle } from '../split-view/split-view.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import { PdfViewerSidebar, type PdfViewerSidebarProps } from './pdf-viewer-sidebar.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';

interface PdfViewerFrameProps<V extends PdfViewport, C extends PdfTextContent> {
  children: ReactNode;
  sidebar?: Omit<PdfViewerSidebarProps<V, C>, 'id' | 'width'> | undefined;
  onKeyDown(event: KeyboardEvent<HTMLElement>): void;
}

const minSidebarWidth = 120;
const maxSidebarWidth = 480;

/** Keeps the sidebar's committed width while it is closed and the document's scroller mounted. */
export function PdfViewerFrame<V extends PdfViewport, C extends PdfTextContent>({
  children,
  sidebar,
  onKeyDown,
}: PdfViewerFrameProps<V, C>) {
  const strings = useUiStrings();
  const sidebarId = useId();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [preferredWidth, setPreferredWidth] = useState(200);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const measured = useElementSize(element, { box: 'client' });
  const extent = measured && measured.width > 0 ? measured.width : maxSidebarWidth * 2;
  const maximum = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, extent / 2));
  const width = clamp(previewWidth ?? preferredWidth, minSidebarWidth, maximum);
  return (
    <div
      {...hooks.slot('stage')}
      ref={setElement}
      style={{ position: 'relative' }}
      onKeyDown={onKeyDown}
    >
      {sidebar ? <PdfViewerSidebar {...sidebar} id={sidebarId} width={width} /> : null}
      {sidebar ? (
        <ResizeHandle
          className={hooks.slotClass('sidebar-resizer')}
          aria-label={strings.sidebar}
          aria-controls={sidebarId}
          orientation="vertical"
          size="sm"
          value={width}
          minValue={minSidebarWidth}
          maxValue={maximum}
          extent={extent}
          onChange={setPreviewWidth}
          onChangeEnd={(next) => {
            setPreferredWidth(next);
            setPreviewWidth(null);
          }}
          onChangeCancel={() => setPreviewWidth(null)}
        />
      ) : null}
      {children}
    </div>
  );
}
