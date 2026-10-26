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
}

/** The image's own size, once it has loaded, for the image it was read from. */
interface NaturalSize extends MediaSize {
  src: string;
}

/** The image, fitted to the viewport, zoomed and turned, in a canvas the viewport scrolls. */
function MediaImage({
  item,
  zoom,
  rotation,
  stage,
}: Pick<MediaStageProps, 'item' | 'zoom' | 'rotation'> & { stage: MediaSize | null }) {
  const [natural, setNatural] = useState<NaturalSize | null>(null);
  const loaded = natural?.src === item.src ? natural : null;
  const layout = loaded && stage ? layoutMedia({ natural: loaded, stage, zoom, rotation }) : null;
  const image = (
    <img
      {...hooks.slot('image')}
      src={item.src}
      alt={item.alt ?? item.name}
      onLoad={(event) => {
        const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
        setNatural({ src: item.src, width, height });
      }}
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
    </div>
  );
}

/** What stands in for a file the viewer cannot draw and the caller does not render. */
function MediaFallback({ item }: { item: MediaViewerItem }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('fallback')}>
      <Icon glyph={getFileGlyph(item.type)} className={hooks.slotClass('fallback-icon')} />
      {strings.previewUnavailable}
    </div>
  );
}

/**
 * The stage: the previous button, the viewport with the image (or the caller's rendering of another
 * file, or a fallback) and the next button.
 */
export function MediaStage(props: MediaStageProps) {
  const { item, viewportRef, hasSiblings } = props;
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const stage = useElementSize(viewportRef, { box: 'client' });
  const isImage = isImageItem(item);
  const custom = isImage ? null : props.renderItem?.(item);
  return (
    <div {...hooks.slot('stage', { kind: isImage ? 'image' : 'file' })}>
      {hasSiblings ? (
        <Button
          className={hooks.slotClass('previous')}
          icon={isRtl ? 'chevron-right' : 'chevron-left'}
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
          <MediaImage item={item} zoom={props.zoom} rotation={props.rotation} stage={stage} />
        ) : isEmptyNode(custom) ? (
          <MediaFallback item={item} />
        ) : (
          <div {...hooks.slot('content')}>{custom}</div>
        )}
      </div>
      {hasSiblings ? (
        <Button
          className={hooks.slotClass('next')}
          icon={isRtl ? 'chevron-left' : 'chevron-right'}
          label={strings.next}
          isDisabled={!props.onNext}
          focusableWhenDisabled
          onPress={props.onNext}
        />
      ) : null}
    </div>
  );
}
