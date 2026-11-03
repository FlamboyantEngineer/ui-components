'use client';

import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isFocusLost, resolveFocusTarget, type FocusTarget } from '../../utils/focus-target.js';
import { requireDefined } from '../../utils/require-defined.js';
import { focusWithRetry } from '../../utils/use-focus-request.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { MediaViewer, type MediaViewerItem } from '../media-viewer/media-viewer.js';
import { AttachmentRemovalContext } from './attachment-context.js';
import {
  getAttachmentImage,
  resolveAttachmentStatus,
  toAttachmentUrl,
  type ChatAttachmentData,
} from './attachment-model.js';
import { ChatAttachment } from './chat-attachment.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type ChatAttachmentFocusTarget = FocusTarget;

export interface ChatAttachmentListProps
  extends
    RefProps<HTMLUListElement>,
    BaseProps,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
  /** The attachments, in the order they show. */
  attachments: readonly ChatAttachmentData[];
  /** Shows a remove button on each attachment, which calls this with the attachment's id. */
  onRemove?: ((id: string) => void) | undefined;
  /** Shows a Retry button on each failed upload, which calls this with the attachment's id. */
  onRetry?: ((id: string) => void) | undefined;
  /** Where focus goes once the reader removes the last attachment, such as the composer's input. */
  finalFocus?: ChatAttachmentFocusTarget | undefined;
}

/** The image the media viewer shows: its key, its place in the gallery and whether the viewer is open. */
interface ViewerState {
  key: Key;
  index: number;
  isOpen: boolean;
}

/**
 * The viewer session once the gallery changed: the same while its image is listed; on the image now
 * at its place, else the last image, while its image left; ended once no image is listed.
 */
function followGallery(
  viewer: ViewerState | null,
  gallery: readonly MediaViewerItem[],
): ViewerState | null {
  if (!viewer) return null;
  const index = gallery.findIndex((item) => item.id === viewer.key);
  if (index === viewer.index) return viewer;
  if (index >= 0) return { ...viewer, index };
  if (gallery.length === 0) return null;
  const at = Math.min(viewer.index, gallery.length - 1);
  return { ...viewer, key: requireDefined(gallery[at]).id, index: at };
}

/**
 * When an open viewer's session ends because its images left and the focus fell to the page,
 * focuses the list's first control, else `finalFocus`.
 */
function useSessionEndFocus(
  isOpen: boolean,
  listRef: RefObject<HTMLUListElement | null>,
  finalFocus: FocusTarget | undefined,
) {
  const wasOpen = useRef(false);
  const owner = useRef<Document | null>(null);
  const stop = useRef(() => {});
  useLayoutEffect(() => () => stop.current(), []);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) owner.current = list.ownerDocument;
    const ended = wasOpen.current && !isOpen;
    wasOpen.current = isOpen;
    if (!ended || !owner.current || !isFocusLost(owner.current)) return;
    // The page outside the viewer can stay inert for a moment, so the focus is retried.
    stop.current();
    stop.current = focusWithRetry(
      () =>
        listRef.current?.querySelector<HTMLElement>('button, a[href]') ??
        resolveFocusTarget(finalFocus),
    );
  });
}

const hooks = createHooks('chat-attachment-list', ['item']);

/** The gallery's media viewer item for an attachment that shows an image, else none. */
function toGalleryItems(attachment: ChatAttachmentData): MediaViewerItem[] {
  const image = getAttachmentImage(attachment);
  if (!image) return [];
  const isComplete = resolveAttachmentStatus(attachment) === 'complete';
  return [
    {
      id: attachment.id,
      src: toAttachmentUrl(attachment.url) ?? image,
      name: attachment.name,
      thumbnailUrl: image,
      downloadUrl: isComplete ? toAttachmentUrl(attachment.url) : undefined,
    },
  ];
}

/**
 * A labelled list of attachments, in their order: images show as thumbnails that open the library's
 * `MediaViewer` on that image, with the list's other images to page through, and other files as
 * chips. Removing an attachment keeps the focus in the list, else sends it to `finalFocus`. An
 * empty list renders nothing.
 */
export function ChatAttachmentList({
  ref,
  attachments,
  onRemove,
  onRetry,
  finalFocus,
  className,
  id,
  ...rest
}: ChatAttachmentListProps) {
  const strings = useUiStrings();
  const removal = useRemovalFocus(attachments, finalFocus);
  const [stored, setViewer] = useState<ViewerState | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const rootRefs = useMergedRefs(listRef, ref);
  const gallery = attachments.flatMap(toGalleryItems);
  const viewer = followGallery(stored, gallery);
  if (viewer !== stored) setViewer(viewer);
  useSessionEndFocus(viewer?.isOpen ?? false, listRef, finalFocus);
  const indexOf = new Map(gallery.map((item, index) => [item.id, index]));
  if (attachments.length === 0) return null;
  const labelledBy = rest['aria-labelledby'];
  return (
    <AttachmentRemovalContext value={removal}>
      <ul
        ref={rootRefs}
        {...hooks.root({ className, props: rest })}
        id={id}
        aria-label={
          labelledBy ? rest['aria-label'] : (rest['aria-label'] ?? strings.attachmentList)
        }
        aria-labelledby={labelledBy}
      >
        {attachments.map((attachment) => (
          <li key={attachment.id} {...hooks.slot('item')}>
            <ChatAttachment
              {...attachment}
              onRemove={onRemove && (() => onRemove(attachment.id))}
              onRetry={onRetry && (() => onRetry(attachment.id))}
              onPreview={
                indexOf.has(attachment.id)
                  ? () =>
                      setViewer({
                        key: attachment.id,
                        index: requireDefined(indexOf.get(attachment.id)),
                        isOpen: true,
                      })
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
      {viewer ? (
        <MediaViewer
          items={gallery}
          selectedKey={viewer.key}
          isOpen={viewer.isOpen}
          onOpenChange={(isOpen) => setViewer({ ...viewer, isOpen })}
          onSelectionChange={(key) =>
            setViewer({ key, index: indexOf.get(key) ?? viewer.index, isOpen: true })
          }
        />
      ) : null}
    </AttachmentRemovalContext>
  );
}
