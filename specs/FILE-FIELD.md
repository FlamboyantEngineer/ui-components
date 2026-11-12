# File Field

`FileField` is a field whose value is an ordered list of stored files: references to files the owner keeps (`FileFieldItem`: an id, a name and optionally a size, a MIME type, a thumbnail and a download URL), not their bytes. It is built on the [Field](FIELD.md) base and the library's [File Upload](FILE-UPLOAD.md): the upload chooses and checks new files and hands the accepted ones to the owner, who uploads them, reports the uploads in progress and adds the stored files to the value. It serves attachment fields of any kind of file (documents, images, video, audio) with the field base's label, description, validation, dirty state, restore, undo and menu.

## UIC-FILE-FIELD-1 - Field

### UIC-FILE-FIELD-1.1 - Field control

`FileField` shall render a `Field` (root also `ui-file-field`) around a `FileUpload` (`ui-file-field__upload`) whose command is the field's control, carrying the control id (`FileUpload`'s `commandId`) so the field's label points at it: it is named by the field's label followed by its own text (provider string `addFile`, or `addFiles` with `allowsMultiple`), described by the field's description and message as well as the upload's own description of the accepted types and limits, and it takes focus when the field is restored or a form finds the field invalid. `variant` chooses the upload's `button` or `dropzone` command.

Implementation: `src/components/file-field/file-field.tsx`, `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-1.2 - One file or several

Without `allowsMultiple` the field shall hold one file: the chooser offers one, `maxFiles` defaults to 1 and the command reads `addFile`. With it, the chooser offers several and there is no count limit unless `maxFiles` sets one.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`

### UIC-FILE-FIELD-1.3 - Checks before upload

`acceptedFileTypes`, `maxSize` and `maxFiles` shall check the chosen and dropped files as `FileUpload` does, `maxFiles` counting the held files and the uploads together, and the files handed on to `onSelect` until `value` or `uploads` changes, however often the field renders for its own reasons; the upload reports the refusals, and `onSelect` receives the accepted files.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-1.4 - Validation

The field shall validate its value as every field does: a required field with no file shows the provider's `valueRequired` message, and the caller's `validate` checks the list. While the field is invalid, the upload publishes `data-invalid`.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-1.5 - Read-only and disabled

A read-only field shall list its files with their previews, download links and actions but offer no command and no removal. A disabled field disables the command and the remove buttons.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`

### UIC-FILE-FIELD-1.6 - Forms

With `name`, the field shall submit each held file's id in a hidden input under that name; a disabled field submits none. Numeric and text file ids remain distinct when the value is reordered, including each file row and hidden form input.

Implementation: `src/components/file-field/file-field-parts.tsx`
Verification: `src/components/file-field/file-field.test.tsx`

## UIC-FILE-FIELD-2 - Files

### UIC-FILE-FIELD-2.1 - Held files

Each held file shall be listed in the upload's file list, before the uploads, with its name, its size when given, its thumbnail (`previewUrl`) or the glyph of its `type`, and a download link (`ui-file-field__download`, a `Link` with the `download` glyph named by the provider string `downloadFile`) that downloads `downloadUrl` under the file's name, when it has one.

Implementation: `src/components/file-field/file-field.tsx`, `src/components/file-field/file-field-parts.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-2.2 - Caller actions and previews

`renderFileActions` shall add the caller's actions to a held file after its download link, and `renderFilePreview` replace its thumbnail or glyph (such as with an audio or video player); neither applies to uploads.

Implementation: `src/components/file-field/file-field.tsx`, `src/components/file-field/file-field-parts.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-2.3 - Removing a file

A held file's remove button shall commit the value without the file. An upload's remove button calls `onUploadRemove` with its id, to cancel it or dismiss its error.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-2.4 - Uploads

`uploads` shall be listed after the held files with their progress or error (UIC-FILE-UPLOAD-3.1). While an upload's progress is below 100 and it has no error, the field is pending, so an enclosing form waits for it.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

## UIC-FILE-FIELD-3 - Changes

### UIC-FILE-FIELD-3.1 - Added files

While the field is dirty, each held file that is not in the committed value shall publish `data-change="added"` (UIC-FILE-UPLOAD-3.9).

Implementation: `src/components/file-field/file-field.tsx`, `src/components/file-field/file-field-changes.ts`
Verification: `src/components/file-field/file-field-changes.test.ts`, `src/components/file-field/file-field.test.tsx`

### UIC-FILE-FIELD-3.2 - Removed files

While the field is dirty, the committed files the value no longer holds shall follow the list in a `role="group"` (`ui-file-field__removed-files`) titled by the provider's `removedFiles` string (`Removed files`) in its `ui-file-field__removed-label` slot, absent while no file is removed. With `hideRemovedLabel`, the group shows no title and publishes `data-hide-label`, and the same string names it (`aria-label`), so its removed files stack right below the held files. Each removed file (`ui-file-field__removed`) shows what a held file shows: its type glyph (`ui-file-field__removed-icon`, decorative), its name in a `FieldPreviousValue` (`ui-file-field__removed-name`) whose restore button (`Restore <name>`, given `showRestoreButton`) puts that one file back in its committed place and commits, its size formatted as a held file's (`ui-file-field__removed-size`, absent without a size), and, with a `downloadUrl`, the same download link as a held file (`ui-file-field__download`, `Download <name>`), beside the restore button and never inside it; downloading restores nothing. The restore button is disabled while the field is full or locked. The reference stylesheet stacks the group below the held files and lays each removed file out like a file row, at the rows' width, with a dashed border, its long name cut with an ellipsis.

Implementation: `src/components/file-field/file-field.tsx`, `src/components/file-field/file-field-changes.ts`, `src/components/file-field/file-field-parts.tsx`, `src/core/strings/field.ts`, `labs/reference/file-field.css`
Verification: `src/components/file-field/file-field-changes.test.ts`, `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

## UIC-FILE-FIELD-4 - Accessibility and hooks

### UIC-FILE-FIELD-4.1 - Accessible names

Every control of the field shall be named in words: the command by the field's label and its own text, each download link `Download <name>` (provider string `downloadFile`), each remove button `Remove <name>` and each restore button `Restore <name>`; the type glyphs and thumbnails are decorative, since the file name stands beside them, and upload errors are announced as alerts.

Implementation: `src/components/file-field/file-field.tsx`, `src/components/file-field/file-field-parts.tsx`, `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-field/file-field.test.tsx`, `e2e/file-field.spec.ts`

### UIC-FILE-FIELD-4.2 - Hooks and caller attributes

`FileField` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on the field's root.

Implementation: `src/components/file-field/file-field.tsx`
Verification: `src/components/file-field/file-field.test.tsx`

## Hooks

| Hook                           | Kind      | Values | Description                                                           |
| ------------------------------ | --------- | ------ | --------------------------------------------------------------------- |
| `ui-file-field`                | root      |        | The field's root (also `ui-field`).                                   |
| `ui-file-field__upload`        | slot      |        | The upload that chooses files and lists them (also `ui-file-upload`). |
| `ui-file-field__download`      | slot      |        | A held file's download link (also `ui-link`).                         |
| `ui-file-field__removed-files` | slot      |        | The titled group of removed committed files, below the held files.    |
| `ui-file-field__removed-label` | slot      |        | The group's `Removed files` title.                                    |
| `ui-file-field__removed`       | slot      |        | A removed committed file, laid out like a file row.                   |
| `ui-file-field__removed-icon`  | slot      |        | The removed file's type glyph (also `ui-icon`).                       |
| `ui-file-field__removed-name`  | slot      |        | Its struck name and restore button (also `ui-field-previous-value`).  |
| `ui-file-field__removed-size`  | slot      |        | Its size.                                                             |
| `data-hide-label`              | attribute | `true` | On the removed files group: `hideRemovedLabel` leaves out its title.  |
