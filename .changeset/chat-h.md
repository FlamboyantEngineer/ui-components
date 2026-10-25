---
'@flamboyantengineer/ui-components': minor
---

Add chat attachments.

- `ChatAttachment` (new) draws one attachment from plain data (`ChatAttachmentData`: `id`, `name`, `mediaType`, `size`, `url`, `thumbnailUrl`, `status`, `progress`, `error`): an image as its thumbnail (a preview button with `onPreview`), any other file as a chip with its type glyph, name and size; upload progress, an error alert with Retry (`onRetry`), a download link once complete and a remove button (`onRemove`). Only relative, `http`, `https`, `blob` and `data` URLs are shown. Hooks: `ui-chat-attachment` with `__preview`, `__thumbnail`, `__icon`, `__name`, `__size`, `__progress`, `__error`, `__download`, `__remove`, and `data-kind` (`image`, `pdf`, `archive`, `text`, `file`), `data-status` (`uploading`, `complete`, `error`) and `data-display` (`thumbnail`, `chip`).
- `ChatAttachmentList` (new) lists a message's or the composer's attachments: its images open `MediaViewer` on the pressed image with the others to page through, `onRemove(id)` and `onRetry(id)` pass through, and removing an attachment moves the focus to the next attachment's remove button, the previous one's, or `finalFocus`. Hooks: `ui-chat-attachment-list`, `__item`.
- Glyphs `file-pdf`, `file-archive` and `file-text`; strings `attachmentList`, `viewAttachment`, `attachmentUploading` and `attachmentFailed`.
- `FileUpload` and `ChatAttachmentList` share one focus-after-removal hook; `FileUpload` behaves as before.
