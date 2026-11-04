// The files the composer holds for the next message, uploaded through the host's `upload`.

import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import { type ChatEngineContext, patchState } from './chat-controller-state.js';

/** Merges `patch` into the composer's attachment `id`, when it still holds it. */
function patchAttachment(
  engine: ChatEngineContext,
  id: string,
  patch: Partial<ChatAttachmentData>,
) {
  const { attachments } = engine.store.get();
  patchState(engine, {
    attachments: attachments.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
  });
}

function startUpload(engine: ChatEngineContext, id: string, file: File) {
  const { upload } = engine.getConfig();
  if (!upload) return;
  const controller = new AbortController();
  engine.uploads.set(id, { file, controller });
  const isCurrent = () =>
    engine.uploads.get(id)?.controller === controller && !controller.signal.aborted;
  // A throw before `upload` returns its promise fails this file as a rejection would, and leaves
  // the rest of the batch to start.
  new Promise<Partial<ChatAttachmentData>>((resolve) => {
    resolve(
      upload(file, {
        signal: controller.signal,
        onProgress: (progress) => {
          if (isCurrent()) patchAttachment(engine, id, { progress });
        },
      }),
    );
  }).then(
    (data) => {
      if (isCurrent())
        patchAttachment(engine, id, { ...data, id, status: 'complete', progress: undefined });
    },
    (error: unknown) => {
      if (!isCurrent()) return;
      const message = error instanceof Error && error.message ? error.message : undefined;
      patchAttachment(engine, id, { status: 'error', error: message });
    },
  );
}

/** Adds the files to the composer, uploading, and uploads each one. */
export function attachFiles(engine: ChatEngineContext, files: readonly File[]) {
  const added = files.map((file) => ({
    file,
    attachment: {
      id: engine.createId(),
      name: file.name,
      mediaType: file.type,
      size: file.size,
      status: 'uploading',
      progress: 0,
    } satisfies ChatAttachmentData,
  }));
  const { attachments } = engine.store.get();
  patchState(engine, { attachments: [...attachments, ...added.map((entry) => entry.attachment)] });
  for (const { file, attachment } of added) startUpload(engine, attachment.id, file);
}

/** Removes the attachment `id` from the composer, aborting its upload. */
export function removeAttachment(engine: ChatEngineContext, id: string) {
  engine.uploads.get(id)?.controller.abort();
  engine.uploads.delete(id);
  const { attachments } = engine.store.get();
  patchState(engine, { attachments: attachments.filter((entry) => entry.id !== id) });
}

/** Uploads the failed attachment `id` again. */
export function retryAttachment(engine: ChatEngineContext, id: string) {
  const entry = engine.uploads.get(id);
  const attachment = engine.store.get().attachments.find((item) => item.id === id);
  if (!entry || attachment?.status !== 'error') return;
  patchAttachment(engine, id, { status: 'uploading', progress: 0, error: undefined });
  startUpload(engine, id, entry.file);
}

/** Whether the composer holds an uploaded file the next message can carry. */
export function hasUploadedFiles(engine: ChatEngineContext): boolean {
  return engine.store.get().attachments.some((entry) => entry.status === 'complete');
}

/** Takes the uploaded files out of the composer for the next message; the others stay. */
export function takeUploadedFiles(engine: ChatEngineContext): ChatAttachmentData[] {
  const { attachments } = engine.store.get();
  const taken = attachments.filter((entry) => entry.status === 'complete');
  for (const entry of taken) engine.uploads.delete(entry.id);
  patchState(engine, { attachments: attachments.filter((entry) => entry.status !== 'complete') });
  return taken.map(({ status: _status, progress: _progress, error: _error, ...rest }) => rest);
}

/** Aborts every upload still running and forgets them, so no late result reaches the composer. */
export function abortUploads(engine: ChatEngineContext) {
  for (const { controller } of engine.uploads.values()) controller.abort();
  engine.uploads.clear();
}
