import { useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { FocusTarget } from '../../utils/focus-target.js';
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
  extends BaseProps, Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
  /** The attachments, in the order they show. */
  attachments: readonly ChatAttachmentData[];
  /** Shows a remove button on each attachment, which calls this with the attachment's id. */
  onRemove?: ((id: string) => void) | undefined;
  /** Shows a Retry button on each failed upload, which calls this with the attachment's id. */
  onRetry?: ((id: string) => void) | undefined;
  /** Where focus goes once the reader removes the last attachment, such as the composer's input. */
  finalFocus?: ChatAttachmentFocusTarget | undefined;
}

/** The image the media viewer shows: its key and whether the viewer is open. */
interface ViewerState {
  key: Key;
  isOpen: boolean;
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
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const gallery = attachments.flatMap(toGalleryItems);
  const inGallery = new Set(gallery.map((item) => item.id));
  if (attachments.length === 0) return null;
  const labelledBy = rest['aria-labelledby'];
  return (
    <AttachmentRemovalContext.Provider value={removal}>
      <ul
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
                inGallery.has(attachment.id)
                  ? () => setViewer({ key: attachment.id, isOpen: true })
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
      {viewer && gallery.length > 0 ? (
        <MediaViewer
          items={gallery}
          selectedKey={viewer.key}
          isOpen={viewer.isOpen}
          onOpenChange={(isOpen) => setViewer({ ...viewer, isOpen })}
          onSelectionChange={(key) => setViewer({ key, isOpen: true })}
        />
      ) : null}
    </AttachmentRemovalContext.Provider>
  );
}
