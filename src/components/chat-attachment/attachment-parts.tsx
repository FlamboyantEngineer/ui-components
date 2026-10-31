'use client';

import { CloseGlyph, DownloadGlyph, type GlyphComponent } from '../../core/glyphs.js';
import { useContext, useState, type RefObject } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { untrustedImageProps } from '../../utils/safe-url.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { ProgressBar } from '../progress-bar/progress-bar.js';
import { AttachmentRemovalContext } from './attachment-context.js';

export const chatAttachmentHooks = createHooks('chat-attachment', [
  'preview',
  'thumbnail',
  'icon',
  'name',
  'size',
  'progress',
  'error',
  'download',
  'remove',
]);

const hooks = chatAttachmentHooks;

/** The image to show, until it fails to load: a broken image falls back to the file chip. */
export function useThumbnail(src: string | undefined) {
  const [brokenSrc, setBrokenSrc] = useState<string | undefined>(undefined);
  return {
    src: src === brokenSrc ? undefined : src,
    onError: () => setBrokenSrc(src),
  };
}

interface AttachmentThumbnailProps {
  src: string;
  name: string;
  onPreview: (() => void) | undefined;
  onError: () => void;
}

/**
 * An image attachment's thumbnail: a button that opens its preview, named for viewing the file,
 * else the image itself, named by the file name, since no name shows beside it.
 */
export function AttachmentThumbnail({ src, name, onPreview, onError }: AttachmentThumbnailProps) {
  const strings = useUiStrings();
  if (!onPreview) {
    return (
      <img
        {...hooks.slot('thumbnail')}
        {...untrustedImageProps}
        src={src}
        alt={name}
        onError={onError}
      />
    );
  }
  return (
    <Button
      className={hooks.slotClass('preview')}
      variant="ghost"
      aria-label={strings.viewAttachment(name)}
      onPress={onPreview}
    >
      <img
        {...hooks.slot('thumbnail')}
        {...untrustedImageProps}
        src={src}
        alt=""
        onError={onError}
      />
    </Button>
  );
}

interface AttachmentChipProps {
  glyph: GlyphComponent;
  name: string;
  size: number | undefined;
  locale: string;
}

/** A file attachment's chip: its type glyph (decorative), its name and its size. */
export function AttachmentChip({ glyph, name, size, locale }: AttachmentChipProps) {
  return (
    <>
      <Icon icon={glyph} className={hooks.slotClass('icon')} />
      <span {...hooks.slot('name')}>{name}</span>
      {size === undefined ? null : <span {...hooks.slot('size')}>{formatBytes(size, locale)}</span>}
    </>
  );
}

/** The upload's progress, named for the file: measured from `progress` (0 to 1), else indeterminate. */
export function AttachmentProgress({ name, progress }: { name: string; progress?: number }) {
  const strings = useUiStrings();
  return (
    <ProgressBar
      className={hooks.slotClass('progress')}
      aria-label={strings.attachmentUploading(name)}
      size="sm"
      value={progress === undefined ? undefined : progress * 100}
      isIndeterminate={progress === undefined}
    />
  );
}

/** A link that downloads the file under its name. */
export function AttachmentDownload({ href, name }: { href: string; name: string }) {
  const strings = useUiStrings();
  return (
    <Link
      className={hooks.slotClass('download')}
      href={href}
      download={name}
      aria-label={strings.downloadFile(name)}
      isStandalone
    >
      <Icon icon={DownloadGlyph} />
    </Link>
  );
}

/**
 * The remove button of a composer's attachment. It registers with the attachment list, which moves
 * focus when the attachment leaves, and hands itself to `buttonRef` for the attachment's own focus.
 */
export function AttachmentRemove({
  id,
  name,
  buttonRef,
  onRemove,
}: {
  id: string;
  name: string;
  buttonRef: RefObject<HTMLElement | null>;
  onRemove: () => void;
}) {
  const strings = useUiStrings();
  const removal = useContext(AttachmentRemovalContext);
  return (
    <Button
      className={hooks.slotClass('remove')}
      icon={CloseGlyph}
      label={strings.removeItem(name)}
      size="sm"
      ref={(button) => {
        buttonRef.current = button;
        removal?.register(id, button);
      }}
      onPress={() => {
        removal?.willRemove(id);
        onRemove();
      }}
    />
  );
}
