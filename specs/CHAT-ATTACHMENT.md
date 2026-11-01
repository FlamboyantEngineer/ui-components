# Chat Attachment

`ChatAttachment` is one file attached to a message or to the composer, drawn from plain data (`ChatAttachmentData`: `id`, `name`, `mediaType`, `size`, `url`, `thumbnailUrl`, `status`, `progress`, `error`): an image shows as a thumbnail, any other file as a chip with its type glyph, name and size. It shows the upload's progress or its error with Retry, a download link once complete and, for the composer, a remove button. `ChatAttachmentList` lists the attachments of one message or of the composer: its images open the library's [Media Viewer](MEDIA-VIEWER.md) to page through them, and removing an attachment keeps the reader's focus in place. The host uploads the files and reports their status; the components hold no files.

## UIC-CHAT-ATTACHMENT-1 - Attachment

### UIC-CHAT-ATTACHMENT-1.1 - Kind and status

`ChatAttachment` shall render a `<div>` (`ui-chat-attachment`) that publishes the attachment's kind as `data-kind`: `image` for an `image/*` media type, `pdf` for `application/pdf`, `archive` for zip, gzip, tar, 7-Zip, RAR, bzip2 and xz types, `text` for `text/*`, `application/json`, `application/xml` and `application/yaml`, and `file` for any other type. A media type that says nothing (empty or `application/octet-stream`) leaves the kind to the name's extension. It publishes `status` as `data-status`: `uploading`, `complete` or `error`, defaulting to `error` when the data has an `error` and to `complete` otherwise.

Implementation: `src/components/chat-attachment/chat-attachment.tsx`, `src/components/chat-attachment/attachment-model.ts`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `src/components/chat-attachment/attachment-model.test.ts`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.2 - Image thumbnail

An `image` attachment with a `thumbnailUrl` or a `url` shall show that image (`ui-chat-attachment__thumbnail`, the thumbnail preferred) and publish `data-display="thumbnail"`; no name shows beside it, so the image is named by the file name. With `onPreview`, the image sits in a ghost `Button` (`ui-chat-attachment__preview`) named by the provider string `viewAttachment` with the file name, which calls `onPreview`, and the image itself is decorative. An image that fails to load gives way to the file chip, including one that failed before the component could listen (before hydration); only the address that failed does, so the failure of an address the host has since replaced never hides the new thumbnail. The thumbnail's address comes from the message, so it sends no referrer (`referrerpolicy="no-referrer"`), loads lazily (`loading="lazy"`) and decodes asynchronously (`decoding="async"`): opening a long conversation does not tell a remote server the page's URL or that a thumbnail far above was reached.

Implementation: `src/components/chat-attachment/chat-attachment.tsx`, `src/components/chat-attachment/attachment-parts.tsx`, `src/core/strings/chat-attachment.ts`, `src/utils/safe-url.ts`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `src/components/chat-attachment/chat-attachment-images.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.3 - File chip

Any other attachment, and an image without a URL to show, shall show as a chip (`data-display="chip"`): its type glyph (`ui-chat-attachment__icon`, decorative: `file-pdf`, `file-archive` or `file-text` for those kinds, `image` for an image, else the glyph of its media family from `getFileGlyph`: `video`, `audio` or `file`), its name (`ui-chat-attachment__name`) and, when given, its size (`ui-chat-attachment__size`, from [formatBytes](FORMAT-BYTES.md) in the `UiProvider` locale).

Implementation: `src/components/chat-attachment/chat-attachment.tsx`, `src/components/chat-attachment/attachment-parts.tsx`, `src/components/chat-attachment/attachment-model.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `src/components/chat-attachment/attachment-model.test.ts`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.4 - Upload progress

An `uploading` attachment shall show a small `ProgressBar` (`ui-chat-attachment__progress`) named by the provider string `attachmentUploading` with the file name, at `progress` (a share from 0 to 1) as a percentage with its value text, so assistive technology reads the value; without `progress` the bar is indeterminate.

Implementation: `src/components/chat-attachment/attachment-parts.tsx`, `src/core/strings/chat-attachment.ts`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.5 - Upload error and Retry

An `error` attachment shall show its `error`, else the provider string `attachmentFailed` with the file name, in an `InlineError` alert (`ui-chat-attachment__error`). With `onRetry`, the alert's Retry button (provider string `retry`) calls it. When the error then leaves and the focus left with its Retry button, focus moves to the attachment's remove button, else to the attachment itself, which script can focus (`tabindex="-1"`), so the reader keeps their place.

Implementation: `src/components/chat-attachment/chat-attachment.tsx`, `src/core/strings/chat-attachment.ts`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.6 - Download

A `complete` attachment with a `url` shall offer a standalone `Link` (`ui-chat-attachment__download`) showing the `download` glyph, named by the provider string `downloadFile` with the file name, that downloads the `url` under the file name.

Implementation: `src/components/chat-attachment/attachment-parts.tsx`, `src/core/strings/media.ts`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.7 - Remove

With `onRemove`, the attachment shall end with an icon-only [Button](BUTTON.md) (`ui-chat-attachment__remove`, `close` glyph) named by the provider string `removeItem` with the file name, which calls `onRemove`.

Implementation: `src/components/chat-attachment/chat-attachment.tsx`, `src/core/strings/common.ts`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-1.8 - Safe URLs

A `url` or `thumbnailUrl` shall be used only when it is relative or uses the `http`, `https`, `blob` or `data` scheme; any other (such as `javascript:`) is ignored, as if the data had none.

Implementation: `src/components/chat-attachment/attachment-model.ts`, `src/utils/safe-url.ts`
Verification: `src/components/chat-attachment/attachment-model.test.ts`, `src/components/chat-attachment/chat-attachment.test.tsx`

### UIC-CHAT-ATTACHMENT-1.9 - Hooks and caller attributes

`ChatAttachment` shall carry the hooks below and put the caller's `className` and `data-*` attributes on its root. Its `id` is the attachment's id from the data, not the element's.

Implementation: `src/components/chat-attachment/chat-attachment.tsx`
Verification: `src/components/chat-attachment/chat-attachment.test.tsx`

## UIC-CHAT-ATTACHMENT-2 - Attachment list

### UIC-CHAT-ATTACHMENT-2.1 - List

`ChatAttachmentList` shall render its `attachments` in order as a list (`<ul>`, `ui-chat-attachment-list`) named by `aria-label`, `aria-labelledby` or else the provider string `attachmentList`, with one item (`<li>`, `ui-chat-attachment-list__item`) per attachment holding its `ChatAttachment`. Every attachment's controls (preview, Retry, download and remove) stay in the Tab order in reading order. An empty list renders nothing.

Implementation: `src/components/chat-attachment/chat-attachment-list.tsx`, `src/core/strings/chat-attachment.ts`
Verification: `src/components/chat-attachment/chat-attachment-list.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-2.2 - Gallery

Each listed image that shows a thumbnail shall be a preview button; pressing it opens a `MediaViewer` on that image, with every listed image that shows a thumbnail, in order, to page through. The viewer shows an image's safe `url`, else its thumbnail, uses the thumbnail in its strip and offers Download for a complete attachment with a `url`. Closing the viewer returns the focus to the button that opened it. The viewer follows the listed images: when its image leaves while others stay, it shows the image now at its place, else the last one; when no image is listed, the viewer session ends, so images listed later open only when pressed. A viewer that ends open while holding the focus hands it to the list's first control, else to `finalFocus`.

Implementation: `src/components/chat-attachment/chat-attachment-list.tsx`
Verification: `src/components/chat-attachment/chat-attachment-list.test.tsx`, `src/components/chat-attachment/chat-attachment-viewer-session.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-2.3 - Remove and Retry

With `onRemove`, every attachment shall show its remove button, which calls `onRemove` with the attachment's `id`; with `onRetry`, every failed upload shows Retry, which calls `onRetry` with its `id`.

Implementation: `src/components/chat-attachment/chat-attachment-list.tsx`
Verification: `src/components/chat-attachment/chat-attachment-list.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-2.4 - Focus after removal

When the owner drops a removed attachment and the focus went with its remove button, focus shall move to the next attachment's remove button, else the previous one's, else to `finalFocus` (a ref or a function returning the element, such as the composer's input), also when the owner stops rendering the list with that removal.

Implementation: `src/components/chat-attachment/chat-attachment-list.tsx`, `src/components/chat-attachment/chat-attachment.tsx`, `src/utils/use-removal-focus.ts`
Verification: `src/components/chat-attachment/chat-attachment-list.test.tsx`, `e2e/chat-attachment.spec.ts`

### UIC-CHAT-ATTACHMENT-2.5 - Hooks and caller attributes

`ChatAttachmentList` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on its list.

Implementation: `src/components/chat-attachment/chat-attachment-list.tsx`
Verification: `src/components/chat-attachment/chat-attachment-list.test.tsx`

## Hooks

| Hook                            | Kind  | Values                                    | Description                                                            |
| ------------------------------- | ----- | ----------------------------------------- | ---------------------------------------------------------------------- |
| `ui-chat-attachment`            | root  |                                           | An attachment's `<div>`.                                               |
| `ui-chat-attachment__preview`   | slot  |                                           | The button holding an image's thumbnail (also `ui-button`).            |
| `ui-chat-attachment__thumbnail` | slot  |                                           | An image's thumbnail `<img>`.                                          |
| `ui-chat-attachment__icon`      | slot  |                                           | A chip's type glyph (also `ui-icon`).                                  |
| `ui-chat-attachment__name`      | slot  |                                           | A chip's file name.                                                    |
| `ui-chat-attachment__size`      | slot  |                                           | A chip's file size.                                                    |
| `ui-chat-attachment__progress`  | slot  |                                           | The upload's progress (also `ui-progress-bar`).                        |
| `ui-chat-attachment__error`     | slot  |                                           | The upload's error with Retry (also `ui-inline-error`).                |
| `ui-chat-attachment__download`  | slot  |                                           | The download link (also `ui-link`).                                    |
| `ui-chat-attachment__remove`    | slot  |                                           | The remove button (also `ui-button`).                                  |
| `data-kind`                     | state | `image`, `pdf`, `archive`, `text`, `file` | On an attachment: the kind of file.                                    |
| `data-status`                   | state | `uploading`, `complete`, `error`          | On an attachment: where its upload stands.                             |
| `data-display`                  | state | `thumbnail`, `chip`                       | On an attachment: an image's thumbnail, or a chip with glyph and name. |
| `ui-chat-attachment-list`       | root  |                                           | The list's `<ul>`.                                                     |
| `ui-chat-attachment-list__item` | slot  |                                           | One attachment's `<li>`.                                               |
