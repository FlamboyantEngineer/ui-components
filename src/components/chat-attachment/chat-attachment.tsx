'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { useContext, useLayoutEffect, useRef, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { AttachmentRemovalContext } from './attachment-context.js';
import {
  getAttachmentGlyph,
  getAttachmentImage,
  getAttachmentKind,
  resolveAttachmentStatus,
  toAttachmentUrl,
  type ChatAttachmentData,
  type ChatAttachmentStatus,
} from './attachment-model.js';
import {
  AttachmentChip,
  AttachmentDownload,
  AttachmentProgress,
  AttachmentThumbnail,
  chatAttachmentHooks as hooks,
  useThumbnail,
} from './attachment-parts.js';

export type {
  ChatAttachmentData,
  ChatAttachmentKind,
  ChatAttachmentStatus,
} from './attachment-model.js';

/** The attachment's data, with the commands its owner offers. `id` is the attachment's, not the element's. */
export interface ChatAttachmentProps extends Omit<BaseProps, 'id'>, ChatAttachmentData {
  /** Shows a remove button, as for a file attached in the composer. */
  onRemove?: (() => void) | undefined;
  /** Shows a Retry button with a failed upload's error. */
  onRetry?: (() => void) | undefined;
  /** Makes an image's thumbnail a button that opens a preview, such as a media viewer. */
  onPreview?: (() => void) | undefined;
}

/**
 * After a Retry press, once the error (and its Retry button) has left and the focus left with it,
 * focuses the attachment's remove button, else the attachment itself. Returns the press recorder.
 */
function useRetryFocus(status: ChatAttachmentStatus, rootRef: RefObject<HTMLDivElement | null>) {
  const retried = useRef(false);
  useLayoutEffect(() => {
    if (!retried.current || status === 'error') return;
    retried.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const root = rootRef.current;
    (root?.querySelector<HTMLElement>(`.${hooks.slotClass('remove')}`) ?? root)?.focus();
  }, [status, rootRef]);
  return () => {
    retried.current = true;
  };
}

/**
 * One attachment: an image's thumbnail (a preview button with `onPreview`), or a chip with the
 * file's type glyph, name and size; the upload's progress, or its error with Retry; a download
 * link once complete; and a remove button for the composer. Its kind, status and display are hooks.
 */
export function ChatAttachment({
  id,
  name,
  mediaType,
  size,
  url,
  thumbnailUrl,
  status: givenStatus,
  progress,
  error,
  onRemove,
  onRetry,
  onPreview,
  className,
  ...rest
}: ChatAttachmentProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const removal = useContext(AttachmentRemovalContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const kind = getAttachmentKind(mediaType, name);
  const status = resolveAttachmentStatus({ status: givenStatus, error });
  const thumbnail = useThumbnail(getAttachmentImage({ mediaType, name, url, thumbnailUrl }));
  const recordRetry = useRetryFocus(status, rootRef);
  const download = status === 'complete' ? toAttachmentUrl(url) : undefined;
  const display = thumbnail.src ? 'thumbnail' : 'chip';
  return (
    <div
      {...hooks.root({ className, props: rest, data: { kind, status, display } })}
      ref={rootRef}
      // Focusable by script only, for the focus to land on after Retry when no control is left.
      tabIndex={-1}
    >
      {thumbnail.src ? (
        <AttachmentThumbnail
          src={thumbnail.src}
          name={name}
          onPreview={onPreview}
          onError={thumbnail.onError}
        />
      ) : (
        <AttachmentChip
          glyph={getAttachmentGlyph(kind, mediaType)}
          name={name}
          size={size}
          locale={locale}
        />
      )}
      {status === 'uploading' ? <AttachmentProgress name={name} progress={progress} /> : null}
      {status === 'error' ? (
        <InlineError
          className={hooks.slotClass('error')}
          onRetry={
            onRetry &&
            (() => {
              recordRetry();
              onRetry();
            })
          }
        >
          {error ?? strings.attachmentFailed(name)}
        </InlineError>
      ) : null}
      {download ? <AttachmentDownload href={download} name={name} /> : null}
      {onRemove ? (
        <Button
          className={hooks.slotClass('remove')}
          icon={CloseGlyph}
          label={strings.removeItem(name)}
          size="sm"
          ref={(button) => removal?.register(id, button)}
          onPress={() => {
            removal?.willRemove(id);
            onRemove();
          }}
        />
      ) : null}
    </div>
  );
}

export { ChatAttachmentList } from './chat-attachment-list.js';
export type { ChatAttachmentFocusTarget, ChatAttachmentListProps } from './chat-attachment-list.js';
