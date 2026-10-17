# File Upload

`FileUpload` chooses files: from the system file chooser through React Aria's `FileTrigger`, and by drag and drop or paste through React Aria's `DropZone`. It checks each file against the accepted types and the size limit, hands the accepted files to its owner and reports the refused ones. It holds no files itself: the owner performs any upload and passes the files back as data to list them, each with its size, its upload progress or its error and a remove button. Sizes are written with [formatBytes](FORMAT-BYTES.md).

## UIC-FILE-UPLOAD-1 - Command

### UIC-FILE-UPLOAD-1.1 - Variants

`variant` shall choose the command and publish `data-variant`. `button`, the default, is a `Button` with the `upload` glyph labelled by `label`, which opens the system file chooser. `dropzone` is a React Aria `DropZone` (`ui-file-upload__dropzone`) holding the `upload` glyph (`ui-file-upload__icon`), `label` as its title (`ui-file-upload__label`), the description and a Browse button (`ui-file-upload__browse`, provider string `browse`, described by the title) that opens the chooser. The drop zone's own keyboard drop target is named by the title.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-1.2 - Description

`description` shall render in `ui-file-upload__description` and describe the button. Without one, the description lists the accepted types and the size limit (provider string `fileSizeLimit` with the size from `formatBytes`) on one metadata line; with neither, there is no description.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-1.3 - Chooser

`acceptedFileTypes` shall narrow what the system chooser offers and `allowsMultiple` let the reader choose several files. Each press opens a fresh chooser, so the same file can be chosen again.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-1.4 - Disabled

`isDisabled` shall disable the buttons and the drop zone, which refuses drops, and publish `data-disabled` on the root.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

## UIC-FILE-UPLOAD-2 - Checking files

### UIC-FILE-UPLOAD-2.1 - Accepted types

A chosen or dropped file shall pass when it matches one of `acceptedFileTypes` by extension (`.pdf`), exact MIME type (`image/png`) or MIME family (`image/*`), ignoring case, or always when no types are given. `onSelect` receives the files that pass, in order. Without `allowsMultiple` only the first offered file is considered.

Implementation: `src/components/file-upload/file-rules.ts`, `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-2.2 - Size limit

A file larger than `maxSize` bytes shall be refused.

Implementation: `src/components/file-upload/file-rules.ts`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-2.3 - Refusals

`onReject` shall receive each refused file with its reason (`type` or `size`), and an `InlineError` alert (`ui-file-upload__rejections`) below the command counts the refusals of each reason (provider strings `rejectedFileType` and `rejectedFileSize`). The next offer of files replaces the message, and one whose files all pass removes it.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-2.4 - Dropping

Files dropped or pasted on the drop zone shall go through the same checks; dropped items that are not files are ignored. While a drag is over the drop zone it carries `data-drop-target`.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

## UIC-FILE-UPLOAD-3 - Listed files

### UIC-FILE-UPLOAD-3.1 - File list

`files` shall render as a list (`ui-file-upload__files`) named by `label`, one `ui-file-upload__file` per file with its name (`ui-file-upload__file-name`), its size when given (`ui-file-upload__file-size`, `formatBytes` in the React Aria locale) and `data-status`: `error` with an error, `uploading` while `progress` is below 100, `complete` at 100, `selected` without progress.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-3.2 - Upload progress

An uploading file shall show a small `ProgressBar` (`ui-file-upload__file-progress`) named by the file name, at its `progress`.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-3.3 - Upload error

A file with an `error` shall show it in an `InlineError` (`ui-file-upload__file-error`), announced as an alert.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-3.4 - Removing a file

With `onRemove`, each file shall have an `IconButton` (`ui-file-upload__file-remove`, `close` glyph) named by the provider string `removeItem` with the file name, which calls `onRemove` with the file's `id`.

Implementation: `src/components/file-upload/file-upload-files.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

## UIC-FILE-UPLOAD-4 - Attributes

### UIC-FILE-UPLOAD-4.1 - Hooks and caller attributes

`FileUpload` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on its root.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`

## Hooks

| Hook                            | Kind      | Values                                       | Description                                                  |
| ------------------------------- | --------- | -------------------------------------------- | ------------------------------------------------------------ |
| `ui-file-upload`                | root      |                                              | The upload's `<div>`.                                        |
| `ui-file-upload__dropzone`      | slot      |                                              | The drop zone of the `dropzone` variant.                     |
| `ui-file-upload__icon`          | slot      |                                              | The drop zone's glyph (also `ui-icon`).                      |
| `ui-file-upload__label`         | slot      |                                              | The drop zone's title.                                       |
| `ui-file-upload__description`   | slot      |                                              | The description.                                             |
| `ui-file-upload__browse`        | slot      |                                              | The drop zone's Browse button (also `ui-button`).            |
| `ui-file-upload__rejections`    | slot      |                                              | The refusal message (also `ui-inline-error`).                |
| `ui-file-upload__files`         | slot      |                                              | The list of files.                                           |
| `ui-file-upload__file`          | slot      |                                              | A listed file.                                               |
| `ui-file-upload__file-name`     | slot      |                                              | A file's name.                                               |
| `ui-file-upload__file-size`     | slot      |                                              | A file's size.                                               |
| `ui-file-upload__file-progress` | slot      |                                              | A file's upload progress (also `ui-progress-bar`).           |
| `ui-file-upload__file-error`    | slot      |                                              | A file's upload error (also `ui-inline-error`).              |
| `ui-file-upload__file-remove`   | slot      |                                              | A file's remove button (also `ui-icon-button`).              |
| `data-variant`                  | attribute | `button`, `dropzone`                         | The command.                                                 |
| `data-status`                   | state     | `selected`, `uploading`, `complete`, `error` | On a listed file: where its upload stands.                   |
| `data-disabled`                 | state     | `true`                                       | Disabled (root, and the drop zone through React Aria).       |
| `data-drop-target`              | state     | `true`                                       | A drag is over the drop zone (React Aria).                   |
| `data-hovered`                  | state     | `true`                                       | Pointer over the drop zone (React Aria).                     |
| `data-focused`                  | state     | `true`                                       | The drop zone's keyboard drop target has focus (React Aria). |
| `data-focus-visible`            | state     | `true`                                       | Keyboard focus on the drop zone (React Aria).                |
