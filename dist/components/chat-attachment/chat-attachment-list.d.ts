import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { FocusTarget } from '../../utils/focus-target.js';
import { type ChatAttachmentData } from './attachment-model.js';
/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type ChatAttachmentFocusTarget = FocusTarget;
export interface ChatAttachmentListProps extends BaseProps, Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
    /** The attachments, in the order they show. */
    attachments: readonly ChatAttachmentData[];
    /** Shows a remove button on each attachment, which calls this with the attachment's id. */
    onRemove?: ((id: string) => void) | undefined;
    /** Shows a Retry button on each failed upload, which calls this with the attachment's id. */
    onRetry?: ((id: string) => void) | undefined;
    /** Where focus goes once the reader removes the last attachment, such as the composer's input. */
    finalFocus?: ChatAttachmentFocusTarget | undefined;
}
/**
 * A labelled list of attachments, in their order: images show as thumbnails that open the library's
 * `MediaViewer` on that image, with the list's other images to page through, and other files as
 * chips. Removing an attachment keeps the focus in the list, else sends it to `finalFocus`. An
 * empty list renders nothing.
 */
export declare function ChatAttachmentList({ attachments, onRemove, onRetry, finalFocus, className, id, ...rest }: ChatAttachmentListProps): import("react").JSX.Element | null;
//# sourceMappingURL=chat-attachment-list.d.ts.map