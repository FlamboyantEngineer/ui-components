import { type RefObject } from 'react';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
export interface ChatQueueProps {
    queue: readonly ChatQueuedMessage[];
    /** Replaces the queue; without it the queued messages cannot be edited or removed. */
    onQueueChange: ((queue: readonly ChatQueuedMessage[]) => void) | undefined;
    /** Edits a queued message in the composer. */
    onEdit: (id: string) => void;
    /** The queued message the composer edits. */
    editingId: string | undefined;
    /** Where focus goes when the last queued message is removed. */
    composerRef: RefObject<HTMLDivElement | null>;
}
/**
 * The messages waiting for the running reply to end, in the order they will go out, each with Edit
 * (in the composer) and Remove. Focus stays in the list as messages are removed.
 */
export declare function ChatQueue({ queue, onQueueChange, onEdit, editingId, composerRef, }: ChatQueueProps): import("react").JSX.Element | null;
//# sourceMappingURL=chat-queue.d.ts.map