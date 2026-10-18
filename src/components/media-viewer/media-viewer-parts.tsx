import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';

/** One file a media viewer shows: an image it draws itself, or another file the caller renders. */
export interface MediaViewerItem {
  /** Unique among the viewer's items. */
  id: Key;
  /** The image's URL, or the file's for the caller's `renderItem`. */
  src: string;
  /** The title while the item shows, and its thumbnail's name. */
  name: string;
  /** The MIME type. Images (`image/*`, or no type) draw built in; other files go to `renderItem`. */
  type?: string | undefined;
  /** The image's text alternative. Defaults to `name`. */
  alt?: string | undefined;
  /** Describes the item under the title. */
  caption?: ReactNode;
  /** A smaller image for the thumbnail strip. Defaults to `src` for an image. */
  thumbnailUrl?: string | undefined;
  /** Where the file downloads from; the viewer then offers a Download link. */
  downloadUrl?: string | undefined;
}

export const mediaViewerHooks = createHooks('media-viewer', [
  'stage',
  'previous',
  'next',
  'viewport',
  'canvas',
  'image',
  'content',
  'fallback',
  'fallback-icon',
  'counter',
  'zoom',
  'rotate',
  'download',
  'thumbnails',
  'thumbnail',
  'thumbnail-image',
  'thumbnail-icon',
]);

const hooks = mediaViewerHooks;

/** Whether the viewer draws the item itself, as an image. */
export function isImageItem(item: MediaViewerItem): boolean {
  return !item.type || item.type.toLowerCase().startsWith('image/');
}

export interface MediaHeaderActionsProps {
  item: MediaViewerItem;
  position: number;
  count: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onRotate: () => void;
}

/** The header's position, zoom and rotate controls for an image, and the Download link. */
export function MediaHeaderActions(props: MediaHeaderActionsProps) {
  const { item, position, count, zoom } = props;
  const strings = useUiStrings();
  return (
    <>
      {count > 1 ? (
        <span {...hooks.slot('counter')} aria-live="polite">
          {strings.stepOfTotal(position, count)}
        </span>
      ) : null}
      {isImageItem(item) ? (
        <>
          <ZoomControl
            className={hooks.slotClass('zoom')}
            value={zoom}
            onChange={props.onZoomChange}
            resetValue={100}
          />
          <IconButton
            className={hooks.slotClass('rotate')}
            icon="rotate"
            label={strings.rotateClockwise}
            size="sm"
            onPress={props.onRotate}
          />
        </>
      ) : null}
      {item.downloadUrl ? (
        <Link
          className={hooks.slotClass('download')}
          href={item.downloadUrl}
          download={item.name}
          aria-label={strings.downloadFile(item.name)}
          isStandalone
        >
          <Icon glyph="download" />
        </Link>
      ) : null}
    </>
  );
}

/** The thumbnail strip: one button per item, the current one marked, each showing that item. */
export function MediaThumbnails({
  items,
  current,
  onSelect,
}: {
  items: readonly MediaViewerItem[];
  current: Key;
  onSelect: (key: Key) => void;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('thumbnails')} role="group" aria-label={strings.thumbnails}>
      {items.map((item) => {
        const url = item.thumbnailUrl ?? (isImageItem(item) ? item.src : undefined);
        return (
          <Button
            key={item.id}
            className={hooks.slotClass('thumbnail')}
            variant="ghost"
            aria-label={item.name}
            aria-current={item.id === current || undefined}
            onPress={() => onSelect(item.id)}
          >
            {url ? (
              <img {...hooks.slot('thumbnail-image')} src={url} alt="" />
            ) : (
              <Icon glyph={getFileGlyph(item.type)} className={hooks.slotClass('thumbnail-icon')} />
            )}
          </Button>
        );
      })}
    </div>
  );
}
