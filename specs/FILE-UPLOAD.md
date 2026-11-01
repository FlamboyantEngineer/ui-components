# File Upload

`FileUpload` chooses files or folders: from the system file chooser through React Aria's `FileTrigger`, and by drag and drop or paste through React Aria's `DropZone`. It checks each file against the accepted types, the size and count limits and the owner's own check, hands the accepted files to its owner and reports the refused ones; a drag says before the drop whether its files would be accepted. It holds no files itself: the owner performs any upload and passes the files back as data to list them, each with an image thumbnail or a type glyph, its size, its upload progress or its error, the owner's actions and a remove button. In a form it submits the listed files under a name and can be required. Sizes are written with [formatBytes](FORMAT-BYTES.md).

## UIC-FILE-UPLOAD-1 - Command

### UIC-FILE-UPLOAD-1.1 - Variants

`variant` shall choose the command and publish `data-variant`. `button`, the default, is a `Button` with the `upload` glyph labelled by `label`, which opens the system file chooser. `dropzone` is a React Aria `DropZone` (`ui-file-upload__dropzone`) holding the `upload` glyph (`ui-file-upload__icon`), `label` as its title (`ui-file-upload__label`), the description and a Browse button (`ui-file-upload__browse`, provider string `browse`, described by the title) that opens the chooser. The drop zone's own keyboard drop target is named by the title.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-1.2 - Description

`description` shall render in `ui-file-upload__description` and describe the button. Without one, the description lists the accepted types, the size limit (provider string `fileSizeLimit` with the size from `formatBytes`) and the count limit (provider string `fileCountLimit`) on one metadata line; with none of them, there is no description.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-1.3 - Chooser

`acceptedFileTypes` shall narrow what the system chooser offers and `allowsMultiple` let the reader choose several files. Each press opens a fresh chooser, so the same file can be chosen again.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-1.4 - Disabled

`isDisabled` shall disable the buttons (the listed files' remove buttons included) and the drop zone, which refuses drops, abandon offers still waiting for the owner's check (UIC-FILE-UPLOAD-2.7), and publish `data-disabled` on the root.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-1.5 - Folders

With `acceptDirectory`, the system chooser shall pick a folder and every file in it is offered, as with `allowsMultiple`; a folder dropped on the drop zone is read, through its subfolders, for its files. Files retain their entry order, with a subfolder's files before the next sibling entry; large folders shall not be limited by JavaScript's function argument count. Without it a dropped folder is ignored. The drop is read as library dropped items (`DroppedFile`, `DroppedDirectory` and `DroppedText`, which is ignored), whatever building block reports it.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/components/file-upload/file-upload-drop.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-1.6 - Read-only

`isReadOnly` shall list the files without the command, the refusal message or the remove buttons, keeping each file's preview and actions, abandon offers still waiting for the owner's check (UIC-FILE-UPLOAD-2.7), and publish `data-readonly` on the root.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload-files.test.tsx`, `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-1.7 - Owner naming and focus

`aria-labelledby` shall name the command (the drop zone's Browse button) by those elements followed by the command's own text, and `aria-label` by that text followed by the command's own text, so the name keeps what the command shows; `aria-describedby` adds to the command's description. `commandRef` receives the command's button, so an owner such as [File Field](FILE-FIELD.md) can focus it, and `commandId` gives the button its id, so an owner's label can point at it; `id` stays on the root.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/components/file-upload/file-upload-drop.tsx`
Verification: `src/components/file-upload/file-upload-files.test.tsx`

## UIC-FILE-UPLOAD-2 - Checking files

### UIC-FILE-UPLOAD-2.1 - Accepted types

A chosen or dropped file shall pass when it matches one of `acceptedFileTypes` by extension (`.pdf`), exact MIME type (`image/png`) or MIME family (`image/*`), ignoring case, or always when no types are given. `onSelect` receives the files that pass, in order. Without `allowsMultiple` or `acceptDirectory` only the first offered file is considered by default (`multipleFileBehavior="first"`); `multipleFileBehavior="reject"` refuses the whole multi-file offer (UIC-FILE-UPLOAD-2.6).

Implementation: `src/components/file-upload/file-rules.ts`, `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-2.2 - Size limit

A file larger than `maxSize` bytes shall be refused.

Implementation: `src/components/file-upload/file-rules.ts`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-2.3 - Refusals

`onReject` shall receive each refused file with its reason (`type`, `size`, `min-size`, `count`, `invalid` with the owner's `message`, or `unchecked` when the owner's check failed), and an `InlineError` alert (`ui-file-upload__rejections`) below the command counts the refusals of each reason (provider strings `rejectedFileType`, `rejectedFileSize`, `rejectedFileSmall`, `rejectedFileCount` and `rejectedFileUnchecked`) and gives each `invalid` file's name and message (`rejectedFileReason`). The next offer of files replaces the message, and one whose files all pass removes it.

Implementation: `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-2.4 - Dropping

Files dropped or pasted on the drop zone shall go through the same checks; dropped items that are not files are ignored (folders, unless UIC-FILE-UPLOAD-1.5). While a drag is over the drop zone it carries `data-drop-target`.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-2.5 - Minimum size

A file smaller than `minSize` bytes shall be refused with the reason `min-size`.

Implementation: `src/components/file-upload/file-rules.ts`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-2.6 - Count limit

With `maxFiles`, the upload shall hold at most that many files, counting the listed `files` and the files it handed on since the owner last gave a new `files` list: the upload's own renders (its refusals, a drag, its status) keep the files handed on counted, and a new list, whether it lists them, leaves them out or removes others, is the owner's answer and counts again from it. Offered files that pass the other checks are accepted in order until the limit, and the rest are refused with the reason `count`. Hosts therefore give a new list once they list or refuse the files handed on.

In single-file mode (neither `allowsMultiple` nor `acceptDirectory`), `multipleFileBehavior="reject"` shall refuse every file in an offer of two or more files with reason `count`, before checking individual files. It shall call no `onSelect`, preserve listed files and keep the chooser single-file. A later valid single file shall still be accepted, including as a replacement, and clear the refusals. Multiple-file and directory modes keep their normal checks regardless of this option.

Implementation: `src/components/file-upload/file-rules.ts`, `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-2.7 - Owner's check

`validate` shall check each offered file that matches the types and fits the size limits, given the files of the same offer accepted before it, so it can refuse names, duplicates or image dimensions: a message it returns refuses the file with the reason `invalid` and that message. It may answer with a promise; the offer is then handed on once every answer has come. An offer made while an earlier one still waits for its answers is checked after the earlier one is handed on, so overlapping offers never pass `maxFiles` together and the refusals shown are the latest offer's. A `validate` that throws, or answers with a promise that rejects, refuses its file as `unchecked` and the offer goes on with the next file, so no error or rejection from the check escapes; errors the `onSelect` and `onReject` callbacks throw are not caught. An answer reaches the `onSelect` and `onReject` the upload last rendered with. When the upload unmounts, or becomes disabled or read-only, while offers wait for their answers, they are abandoned with the offers queued behind them: their answers call nothing and show nothing, and an offer made after the upload is enabled again is checked on its own. The checks run in this order: type, size, `validate`, count.

Implementation: `src/components/file-upload/file-rules.ts`, `src/components/file-upload/file-upload.tsx`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-2.8 - Drag feedback

While a drag is over the drop zone, it shall carry `data-drop-accept` when the dragged files would pass the checks a drag allows (their count against `maxFiles`, their MIME types against the MIME rules of `acceptedFileTypes`) and `data-drop-reject` otherwise. Single-file mode with `multipleFileBehavior="reject"` shall mark a drag of several files as rejected. Extensions, sizes and `validate` need the dropped files, so a file only they could refuse counts as passing until the drop.

Implementation: `src/components/file-upload/file-rules.ts`, `src/components/file-upload/file-upload-drop.tsx`, `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-rules.test.ts`, `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

## UIC-FILE-UPLOAD-3 - Listed files

### UIC-FILE-UPLOAD-3.1 - File list

`files` shall render as a list (`ui-file-upload__files`) named by `label`, one `ui-file-upload__file` per file with its name (`ui-file-upload__file-name`), its size when given (`ui-file-upload__file-size`, `formatBytes` in the `UiProvider` locale) and `data-status`: `error` with an error, `uploading` while `progress` is below 100, `complete` at 100, `selected` without progress. Numeric and text file ids remain distinct when rows are reordered, preserving each file row's state.

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

With `onRemove`, each file shall have a `Button` (`ui-file-upload__file-remove`, `close` glyph) named by the provider string `removeItem` with the file name, which calls `onRemove` with the file's `id`. When the owner then drops the file and focus went with its row, focus moves to the next file's remove button, else the previous file's, else the command.

Implementation: `src/components/file-upload/file-upload-files.tsx`, `src/components/file-upload/file-upload.tsx`, `src/utils/use-removal-focus.ts`, `src/core/strings.ts`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-3.5 - Image previews

A listed file whose `file` is an image (`image/*`) shall show a thumbnail (`ui-file-upload__file-preview`, an `<img>` with an empty `alt`, since its name is beside it) from a temporary URL the upload creates while rendering and revokes when the file changes or leaves the list (a Strict Mode remount keeps it); a file without one shows its `previewUrl` instead.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-3.6 - Caller previews

`renderFilePreview` shall replace a listed file's thumbnail or glyph with what it returns for the file (such as an audio or video player), in `ui-file-upload__file-media`; when it returns nothing (`null`, `undefined`, a boolean or an empty string) the file keeps its built-in preview.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload-files.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-3.7 - Type glyph

A listed file without a thumbnail shall show the glyph of its MIME type (`ui-file-upload__file-icon`, decorative): `image`, `video` or `audio` for those families, `file` otherwise, from its `type`, else its `file`'s type (`getFileGlyph`).

Implementation: `src/components/file-upload/file-upload-files.tsx`, `src/utils/file-glyph.ts`, `src/core/glyphs.tsx`
Verification: `src/components/file-upload/file-upload-files.test.tsx`, `src/utils/file-glyph.test.ts`

### UIC-FILE-UPLOAD-3.8 - Caller actions

`renderFileActions` shall render what it returns for each listed file (such as open or download links) in `ui-file-upload__file-actions`, after the file's progress and error and before its remove button; a file it returns nothing for has no actions part.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload-files.test.tsx`, `e2e/file-upload.spec.ts`

### UIC-FILE-UPLOAD-3.9 - Changed files

A listed file whose `change` is `added` shall publish `data-change="added"`, for an owner that compares the list against a committed one.

Implementation: `src/components/file-upload/file-upload-files.tsx`
Verification: `src/components/file-upload/file-upload-files.test.tsx`

## UIC-FILE-UPLOAD-4 - Attributes

### UIC-FILE-UPLOAD-4.1 - Hooks and caller attributes

`FileUpload` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on its root.

Implementation: `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`

### UIC-FILE-UPLOAD-4.2 - Forms

With `name` or `isRequired`, the upload shall render a hidden file input that holds the listed files' `file`s, so a native form submit or `FormData` carries them under `name` (in browsers that can set an input's files). While `isRequired` and no file is listed, a form submit is refused: the upload shows the provider string `valueRequired` in an `InlineError` alert (`ui-file-upload__error`) that describes the command, publishes `data-invalid`, and moves focus to the command; listing a file clears it. A disabled upload's input is disabled, so the form neither submits its files nor refuses a submit for it, and a read-only upload never refuses a submit. A native reset of the form (a reset button or `form.reset()`) leaves the listed files, which the owner holds, and keeps them submitted: form data built after the reset, even in the same task, carries the listed files under `name`, a required upload that lists files stays valid, and once every listener has seen the reset the input holds the listed files again. A reset a listener cancels changes nothing. `isRequired` publishes `data-required`. `isInvalid` likewise shows the owner's `errorMessage` there and publishes `data-invalid`.

Implementation: `src/components/file-upload/file-upload-form.tsx`, `src/components/file-upload/file-upload.tsx`
Verification: `src/components/file-upload/file-upload.test.tsx`, `e2e/file-upload.spec.ts`

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
| `ui-file-upload__error`         | slot      |                                              | The required or invalid message (also `ui-inline-error`).    |
| `ui-file-upload__files`         | slot      |                                              | The list of files.                                           |
| `ui-file-upload__file`          | slot      |                                              | A listed file.                                               |
| `ui-file-upload__file-preview`  | slot      |                                              | A file's image thumbnail.                                    |
| `ui-file-upload__file-media`    | slot      |                                              | A file's caller preview, from `renderFilePreview`.           |
| `ui-file-upload__file-icon`     | slot      |                                              | A file's type glyph (also `ui-icon`).                        |
| `ui-file-upload__file-name`     | slot      |                                              | A file's name.                                               |
| `ui-file-upload__file-size`     | slot      |                                              | A file's size.                                               |
| `ui-file-upload__file-progress` | slot      |                                              | A file's upload progress (also `ui-progress-bar`).           |
| `ui-file-upload__file-error`    | slot      |                                              | A file's upload error (also `ui-inline-error`).              |
| `ui-file-upload__file-actions`  | slot      |                                              | A file's caller actions, from `renderFileActions`.           |
| `ui-file-upload__file-remove`   | slot      |                                              | A file's remove button (also `ui-button`).                   |
| `data-variant`                  | attribute | `button`, `dropzone`                         | The command.                                                 |
| `data-status`                   | state     | `selected`, `uploading`, `complete`, `error` | On a listed file: where its upload stands.                   |
| `data-change`                   | state     | `added`                                      | On a listed file: an edit added it.                          |
| `data-disabled`                 | state     | `true`                                       | Disabled (root, and the drop zone through React Aria).       |
| `data-readonly`                 | state     | `true`                                       | Read-only: no command and no removal (root).                 |
| `data-required`                 | state     | `true`                                       | A form needs a file (root).                                  |
| `data-invalid`                  | state     | `true`                                       | The required or invalid message shows (root).                |
| `data-drop-accept`              | state     | `true`                                       | A drag over the drop zone would be accepted.                 |
| `data-drop-reject`              | state     | `true`                                       | A drag over the drop zone would be refused.                  |
| `data-drop-target`              | state     | `true`                                       | A drag is over the drop zone (React Aria).                   |
| `data-hovered`                  | state     | `true`                                       | Pointer over the drop zone (React Aria).                     |
| `data-focused`                  | state     | `true`                                       | The drop zone's keyboard drop target has focus (React Aria). |
| `data-focus-visible`            | state     | `true`                                       | Keyboard focus on the drop zone (React Aria).                |
