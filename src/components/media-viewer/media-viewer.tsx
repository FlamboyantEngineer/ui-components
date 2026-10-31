'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { Modal } from '../modal/modal.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { resolveMediaKey, type MediaKeyCommand } from './media-layout.js';
import { MediaStage } from './media-stage.js';
import {
  MediaHeaderActions,
  MediaThumbnails,
  isImageItem,
  mediaViewerHooks as hooks,
  type MediaViewerItem,
} from './media-viewer-parts.js';
import { isNode } from '../../utils/is-element.js';

export type { MediaViewerItem } from './media-viewer-parts.js';

export interface MediaViewerProps extends BaseProps, OpenStateProps {
  /** The files to page through, in order. */
  items: readonly MediaViewerItem[];
  /** The item shown, controlled. */
  selectedKey?: Key | undefined;
  /** The item shown first, uncontrolled. Defaults to the first item. */
  defaultSelectedKey?: Key | undefined;
  /** Called with the item moved to. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /** Renders a file that is not an image, such as a PDF in the library's `PdfViewer`. */
  renderItem?: ((item: MediaViewerItem) => ReactNode) | undefined;
}

/** How the shown image is zoomed and turned; moving to another item starts afresh. */
interface MediaView {
  key: Key | undefined;
  zoom: number;
  rotation: number;
}

/** Whether the arrow keys scroll the image: focus is in the viewport and the image is wider. */
function isPanning(viewport: HTMLElement | null, target: EventTarget): boolean {
  return (
    viewport !== null &&
    isNode(target) &&
    viewport.contains(target) &&
    viewport.scrollWidth > viewport.clientWidth
  );
}

/** The zoom a key asks for, or the current one when there is no level that way. */
function stepZoom(zoom: number, command: MediaKeyCommand): number {
  return findNextZoomLevel(defaultZoomLevels, zoom, command === 'zoom-in' ? 1 : -1) ?? zoom;
}

/**
 * A lightbox over the page, on the library's `Modal`: it shows one file of a set at a time with its
 * name and caption, moves to the previous and next file from buttons, a thumbnail strip and the
 * arrow keys, and zooms (`ZoomControl`, `+` and `-`), turns and scrolls images. Other files, such as
 * PDFs, render through `renderItem`. Each file with a download URL offers a Download link. Escape
 * closes it.
 */
export function MediaViewer({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  renderItem,
  className,
  ...rest
}: MediaViewerProps) {
  const { direction } = useLocale();
  const [key, setKey] = useControllableState<Key | undefined>(
    selectedKey,
    defaultSelectedKey ?? items[0]?.id,
    (next) => {
      if (next !== undefined) onSelectionChange?.(next);
    },
  );
  const [ownView, setView] = useState<MediaView>({ key, zoom: 100, rotation: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const index = Math.max(
    0,
    items.findIndex((entry) => entry.id === key),
  );
  const item = items[index];
  if (!item) return null;
  const view = ownView.key === item.id ? ownView : { key: item.id, zoom: 100, rotation: 0 };
  // Moving to another item shows it afresh, so coming back to one shows it at 100% again.
  if (view !== ownView) setView(view);
  const move = (offset: number) => {
    const target = items[index + offset];
    return target ? () => setKey(target.id) : undefined;
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const panning = isPanning(viewportRef.current, event.target);
    const command = resolveMediaKey(event.nativeEvent, direction, panning);
    if (!command) return;
    event.preventDefault();
    if (command === 'previous' || command === 'next') move(command === 'next' ? 1 : -1)?.();
    else if (isImageItem(item)) setView({ ...view, zoom: stepZoom(view.zoom, command) });
  };
  return (
    <Modal
      {...rest}
      className={mergeClassNames(hooks.className, className)}
      title={item.name}
      description={item.caption}
      size="full"
      bodyLayout="column"
      showCloseButton
      initialFocus={viewportRef}
      onKeyDown={onKeyDown}
      headerActions={
        <MediaHeaderActions
          item={item}
          position={index + 1}
          count={items.length}
          zoom={view.zoom}
          onZoomChange={(zoom) => setView({ ...view, zoom })}
          onRotate={() => setView({ ...view, rotation: (view.rotation + 90) % 360 })}
        />
      }
      footerContent={
        items.length > 1 ? (
          <MediaThumbnails items={items} current={item.id} onSelect={setKey} />
        ) : null
      }
    >
      <MediaStage
        item={item}
        zoom={view.zoom}
        rotation={view.rotation}
        viewportRef={viewportRef}
        hasSiblings={items.length > 1}
        onPrevious={move(-1)}
        onNext={move(1)}
        renderItem={renderItem}
      />
    </Modal>
  );
}
