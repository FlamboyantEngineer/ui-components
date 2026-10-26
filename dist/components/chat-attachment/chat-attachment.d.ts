import type { BaseProps } from '../../core/props.js';
import { type ChatAttachmentData } from './attachment-model.js';
export type { ChatAttachmentData, ChatAttachmentKind, ChatAttachmentStatus, } from './attachment-model.js';
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
 * One attachment: an image's thumbnail (a preview button with `onPreview`), or a chip with the
 * file's type glyph, name and size; the upload's progress, or its error with Retry; a download
 * link once complete; and a remove button for the composer. Its kind, status and display are hooks.
 */
export declare function ChatAttachment({ id, name, mediaType, size, url, thumbnailUrl, status: givenStatus, progress, error, onRemove, onRetry, onPreview, className, ...rest }: ChatAttachmentProps): import("react").JSX.Element;
export { ChatAttachmentList } from './chat-attachment-list.js';
export type { ChatAttachmentFocusTarget, ChatAttachmentListProps } from './chat-attachment-list.js';
//# sourceMappingURL=chat-attachment.d.ts.map