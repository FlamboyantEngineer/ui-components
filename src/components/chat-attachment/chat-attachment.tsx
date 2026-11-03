'use client';

import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { isFocusLost } from '../../utils/focus-target.js';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { InlineError } from '../inline-error/inline-error.js';
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
  AttachmentRemove,
  AttachmentThumbnail,
  chatAttachmentHooks as hooks,
  useThumbnail,
} from './attachment-parts.js';
import { getOwnerDocument } from '../../utils/owner-window.js';

export type {
  ChatAttachmentData,
  ChatAttachmentKind,
  ChatAttachmentStatus,
} from './attachment-model.js';

/** The attachment's data, with the commands its owner offers. `id` is the attachment's, not the element's. */
export interface ChatAttachmentProps
  extends RefProps<HTMLDivElement>, Omit<BaseProps, 'id'>, ChatAttachmentData {
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
function useRetryFocus(
  status: ChatAttachmentStatus,
  rootRef: RefObject<HTMLDivElement | null>,
  removeRef: RefObject<HTMLElement | null>,
) {
  const retried = useRef(false);
  useLayoutEffect(() => {
    if (!retried.current || status === 'error') return;
    retried.current = false;
    const root = rootRef.current;
    if (!isFocusLost(getOwnerDocument(root))) return;
    (removeRef.current ?? root)?.focus();
  }, [status, rootRef, removeRef]);
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
  ref,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useMergedRefs(rootRef, ref);
  const removeRef = useRef<HTMLElement>(null);
  const kind = getAttachmentKind(mediaType, name);
  const status = resolveAttachmentStatus({ status: givenStatus, error });
  const thumbnail = useThumbnail(getAttachmentImage({ mediaType, name, url, thumbnailUrl }));
  const recordRetry = useRetryFocus(status, rootRef, removeRef);
  const download = status === 'complete' ? toAttachmentUrl(url) : undefined;
  const display = thumbnail.src ? 'thumbnail' : 'chip';
  return (
    <div
      {...hooks.root({ className, props: rest, data: { kind, status, display } })}
      ref={rootRefs}
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
        <AttachmentRemove id={id} name={name} buttonRef={removeRef} onRemove={onRemove} />
      ) : null}
    </div>
  );
}

export { ChatAttachmentList } from './chat-attachment-list.js';
export type { ChatAttachmentFocusTarget, ChatAttachmentListProps } from './chat-attachment-list.js';
