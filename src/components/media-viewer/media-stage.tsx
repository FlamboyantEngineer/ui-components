'use client';

import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import { useState, type ReactNode, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { layoutMedia, type MediaSize } from './media-layout.js';
import {
  isImageItem,
  mediaViewerHooks as hooks,
  type MediaViewerItem,
} from './media-viewer-parts.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { MediaImageRequest } from './use-image-request.js';

interface MediaStageProps {
  item: MediaViewerItem;
  zoom: number;
  rotation: number;
  /** The scrolling viewport, which takes focus when the viewer opens. */
  viewportRef: RefObject<HTMLDivElement | null>;
  /** Moves to the previous item; `undefined` at the first. */
  onPrevious: (() => void) | undefined;
  /** Moves to the next item; `undefined` at the last. */
  onNext: (() => void) | undefined;
  /** Several items: the stage shows the previous and next buttons. */
  hasSiblings: boolean;
  renderItem: ((item: MediaViewerItem) => ReactNode) | undefined;
  /** The shown image's request. */
  request: MediaImageRequest;
}

/** The image, fitted to the viewport, zoomed and turned, in a canvas the viewport scrolls. */
function MediaImage({
  item,
  zoom,
  rotation,
  stage,
  request,
}: Pick<MediaStageProps, 'item' | 'zoom' | 'rotation' | 'request'> & { stage: MediaSize | null }) {
  const [natural, setNatural] = useState<MediaSize | null>(null);
  const layout = natural && stage ? layoutMedia({ natural, stage, zoom, rotation }) : null;
  if (request.status === 'failed') return <MediaImageError item={item} onRetry={request.retry} />;
  const image = (
    <img
      {...hooks.slot('image')}
      src={item.src}
      alt={item.alt ?? item.name}
      onLoad={(event) => {
        const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
        // A response that decodes to nothing is no image.
        if (width === 0 && height === 0) {
          request.settle(request.id, 'failed');
          return;
        }
        setNatural({ width, height });
        request.settle(request.id, 'loaded');
      }}
      onError={() => request.settle(request.id, 'failed')}
      style={
        layout
          ? {
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: layout.image.width,
              height: layout.image.height,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }
          : undefined
      }
    />
  );
  return (
    <div
      {...hooks.slot('canvas')}
      style={
        layout
          ? { position: 'relative', width: layout.canvas.width, height: layout.canvas.height }
          : undefined
      }
    >
      {image}
      {request.status === 'loading' ? <MediaImageLoading /> : null}
    </div>
  );
}

function MediaImageLoading() {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('loading')} role="status">
      {strings.loading}
    </div>
  );
}

/** What stands in for an image that failed to load: why, and a way to request it again. */
function MediaImageError({ item, onRetry }: { item: MediaViewerItem; onRetry: () => void }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('error')} role="alert">
      <Icon icon={getFileGlyph(item.type)} className={hooks.slotClass('fallback-icon')} />
      {strings.imageLoadFailed(item.name)}
      <Button className={hooks.slotClass('retry')} size="sm" onPress={onRetry}>
        {strings.retry}
      </Button>
    </div>
  );
}

/** What stands in for a file the viewer cannot draw and the caller does not render. */
function MediaFallback({ item }: { item: MediaViewerItem }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('fallback')}>
      <Icon icon={getFileGlyph(item.type)} className={hooks.slotClass('fallback-icon')} />
      {strings.previewUnavailable}
    </div>
  );
}

/**
 * The stage: the previous button, the viewport with the image (or the caller's rendering of another
 * file, or a fallback) and the next button.
 */
export function MediaStage(props: MediaStageProps) {
  const { item, viewportRef, hasSiblings, request } = props;
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const stage = useElementSize(viewportRef, { box: 'client' });
  const isImage = isImageItem(item);
  const custom = isImage ? null : props.renderItem?.(item);
  return (
    <div {...hooks.slot('stage', { kind: isImage ? 'image' : 'file', status: request.status })}>
      {hasSiblings ? (
        <Button
          className={hooks.slotClass('previous')}
          icon={isRtl ? ChevronRightGlyph : ChevronLeftGlyph}
          label={strings.previous}
          isDisabled={!props.onPrevious}
          focusableWhenDisabled
          onPress={props.onPrevious}
        />
      ) : null}
      <div
        {...hooks.slot('viewport')}
        ref={viewportRef}
        role="group"
        aria-label={strings.mediaStage(item.name)}
        tabIndex={0}
      >
        {isImage ? (
          // One image per request, so a retry or a new URL starts from nothing.
          <MediaImage
            key={request.id}
            item={item}
            zoom={props.zoom}
            rotation={props.rotation}
            stage={stage}
            request={request}
          />
        ) : isEmptyNode(custom) ? (
          <MediaFallback item={item} />
        ) : (
          // One boundary per item, so the caller's state for one file never carries to another.
          <div key={toKeyIdentity(item.id)} {...hooks.slot('content')}>
            {custom}
          </div>
        )}
      </div>
      {hasSiblings ? (
        <Button
          className={hooks.slotClass('next')}
          icon={isRtl ? ChevronLeftGlyph : ChevronRightGlyph}
          label={strings.next}
          isDisabled={!props.onNext}
          focusableWhenDisabled
          onPress={props.onNext}
        />
      ) : null}
    </div>
  );
}
