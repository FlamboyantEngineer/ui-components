import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import { type ChatEngineContext } from './chat-controller-state.js';
/** Adds the files to the composer, uploading, and uploads each one. */
export declare function attachFiles(engine: ChatEngineContext, files: readonly File[]): void;
/** Removes the attachment `id` from the composer, aborting its upload. */
export declare function removeAttachment(engine: ChatEngineContext, id: string): void;
/** Uploads the failed attachment `id` again. */
export declare function retryAttachment(engine: ChatEngineContext, id: string): void;
/** Whether the composer holds an uploaded file the next message can carry. */
export declare function hasUploadedFiles(engine: ChatEngineContext): boolean;
/** Takes the uploaded files out of the composer for the next message; the others stay. */
export declare function takeUploadedFiles(engine: ChatEngineContext): ChatAttachmentData[];
/** Aborts every upload still running. */
export declare function abortUploads(engine: ChatEngineContext): void;
//# sourceMappingURL=chat-uploads.d.ts.map