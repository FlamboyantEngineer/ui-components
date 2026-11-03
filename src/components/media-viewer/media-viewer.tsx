'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { Modal } from '../modal/modal.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { resolveMediaKey, type MediaKeyCommand } from './media-layout.js';
import { MediaStage } from './media-stage.js';
import { useImageRequest } from './use-image-request.js';
import { containsFocus, isFocused } from '../../utils/focus-target.js';
import {
  MediaHeaderActions,
  MediaThumbnails,
  isImageItem,
  mediaViewerHooks as hooks,
  type MediaViewerItem,
} from './media-viewer-parts.js';
import { isNode } from '../../utils/is-element.js';
import { useRetainedKey } from '../../utils/use-retained-key.js';

export type { MediaViewerItem } from './media-viewer-parts.js';

export interface MediaViewerProps extends RefProps<HTMLDivElement>, BaseProps, OpenStateProps {
  /** The files to page through, in order. */
  items: readonly MediaViewerItem[];
  /** The item shown, controlled. */
  selectedKey?: Key | undefined;
  /** The item shown first, uncontrolled. Defaults to the first item. */
  defaultSelectedKey?: Key | undefined;
  /** Called with the item moved to. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /**
   * Renders a file that is not an image, such as a PDF in the library's `PdfViewer`. Each item gets
   * a rendering of its own: moving to another item starts the caller's state afresh.
   */
  renderItem?: ((item: MediaViewerItem) => ReactNode) | undefined;
  /**
   * Called when the shown image fails to load, for example to give the item a fresh `src`; the
   * viewer shows the failure with a Retry button meanwhile.
   */
  onImageError?: ((item: MediaViewerItem) => void) | undefined;
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

/**
 * Before the shown item changes: focus inside the caller's rendering of it, which the next item
 * replaces, moves to the viewport, so it stays in the viewer.
 */
function keepFocusInViewport(viewport: HTMLElement | null) {
  if (!viewport) return;
  if (!isFocused(viewport) && containsFocus(viewport)) viewport.focus();
}

/** The zoom a key asks for, or the current one when there is no level that way. */
function stepZoom(zoom: number, command: MediaKeyCommand): number {
  return findNextZoomLevel(defaultZoomLevels, zoom, command === 'zoom-in' ? 1 : -1) ?? zoom;
}

interface MediaViewerDialogProps extends Omit<
  MediaViewerProps,
  'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
> {
  item: MediaViewerItem;
  index: number;
  setKey: (key: Key) => void;
}

/** The open viewer around one shown item: its modal, header, stage and thumbnails. */
function MediaViewerDialog({
  items,
  item,
  index,
  setKey,
  renderItem,
  onImageError,
  className,
  ...modal
}: MediaViewerDialogProps) {
  const { direction } = useLocale();
  const [ownView, setView] = useState<MediaView>({ key: item.id, zoom: 100, rotation: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const request = useImageRequest(item, onImageError);
  const view = ownView.key === item.id ? ownView : { key: item.id, zoom: 100, rotation: 0 };
  // Moving to another item shows it afresh, so coming back to one shows it at 100% again.
  if (view !== ownView) setView(view);
  const isImageReady = isImageItem(item) && request.status === 'loaded';
  const show = (key: Key) => {
    keepFocusInViewport(viewportRef.current);
    setKey(key);
  };
  const previous = items[index - 1];
  const next = items[index + 1];
  const move = (target: MediaViewerItem | undefined) => {
    if (target) show(target.id);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const panning = isPanning(viewportRef.current, event.target);
    const command = resolveMediaKey(event.nativeEvent, direction, panning);
    if (!command) return;
    event.preventDefault();
    if (command === 'previous' || command === 'next') move(command === 'next' ? next : previous);
    else if (isImageReady) setView({ ...view, zoom: stepZoom(view.zoom, command) });
  };
  return (
    <Modal
      {...modal}
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
          isImageReady={isImageReady}
          position={index + 1}
          count={items.length}
          zoom={view.zoom}
          onZoomChange={(zoom) => setView({ ...view, zoom })}
          onRotate={() => setView({ ...view, rotation: (view.rotation + 90) % 360 })}
        />
      }
      footerContent={
        items.length > 1 ? (
          <MediaThumbnails items={items} current={item.id} onSelect={show} />
        ) : null
      }
    >
      <MediaStage
        item={item}
        zoom={view.zoom}
        rotation={view.rotation}
        viewportRef={viewportRef}
        hasSiblings={items.length > 1}
        onPrevious={previous ? () => move(previous) : undefined}
        onNext={next ? () => move(next) : undefined}
        renderItem={renderItem}
        request={request}
      />
    </Modal>
  );
}

/**
 * A lightbox over the page, on the library's `Modal`: it shows one file of a set at a time with its
 * name and caption, moves to the previous and next file from buttons, a thumbnail strip and the
 * arrow keys, and zooms (`ZoomControl`, `+` and `-`), turns and scrolls images. Other files, such as
 * PDFs, render through `renderItem`. Each file with a download URL offers a Download link. Escape
 * closes it. While `items` is empty it renders nothing but keeps its open state.
 */
export function MediaViewer({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isOpen,
  defaultOpen,
  onOpenChange,
  ...rest
}: MediaViewerProps) {
  // The viewer, not its modal, holds the open state, so a list that empties for a while (and
  // unmounts the modal) neither forgets a close nor applies `defaultOpen` again.
  const [open, setOpen] = useControllableState(isOpen, Boolean(defaultOpen), onOpenChange);
  const [key, setKey] = useControllableState<Key | undefined>(
    selectedKey,
    defaultSelectedKey ?? items[0]?.id,
    (next) => {
      if (next !== undefined) onSelectionChange?.(next);
    },
  );
  const isItem = (id: Key) => items.some((entry) => entry.id === id);
  // With no selected item among the items, the item shown first stays shown while it is there.
  const shownKey = useRetainedKey(key, isItem, items[0]?.id);
  const index = Math.max(
    0,
    items.findIndex((entry) => entry.id === shownKey),
  );
  const item = items[index];
  if (!item) return null;
  return (
    <MediaViewerDialog
      {...rest}
      items={items}
      item={item}
      index={index}
      setKey={setKey}
      isOpen={open}
      onOpenChange={setOpen}
    />
  );
}
