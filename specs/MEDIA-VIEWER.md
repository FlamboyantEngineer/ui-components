# Media Viewer

`MediaViewer` is a lightbox on the library's [Modal](MODAL.md) that shows one file of a set at a time (`MediaViewerItem`: an id, a URL, a name and optionally a MIME type, a text alternative, a caption, a thumbnail and a download URL). It draws images itself, fitted to the stage, with zoom through [Zoom Control](ZOOM-CONTROL.md), quarter turns and scrolling to pan, and hands other files, such as PDFs for the library's [PDF Viewer](PDF-VIEWER.md), to the caller's `renderItem`. The reader moves through the set with previous and next buttons, a thumbnail strip and the arrow keys.

## UIC-MEDIA-VIEWER-1 - Viewer

### UIC-MEDIA-VIEWER-1.1 - Lightbox

`MediaViewer` shall render a `Modal` (root also `ui-media-viewer`) of size `full` with a `column` body, a close button and no action bar, whose title is the shown item's `name` and whose description is its `caption`. `isOpen`, `defaultOpen` and `onOpenChange` control it as they control the modal, and Escape closes it. A viewer with no items renders nothing.

Implementation: `src/components/media-viewer/media-viewer.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-1.2 - Moving through the set

`selectedKey` (controlled) or `defaultSelectedKey` (uncontrolled, defaulting to the first item) shall choose the shown item, and `onSelectionChange` receives the key of each item moved to. With more than one item, the stage starts with a previous button (`ui-media-viewer__previous`, `chevron-left` glyph, provider string `previous`) and ends with a next button (`ui-media-viewer__next`, `chevron-right`, `next`), each disabled at its end of the set, and the header shows the position (`ui-media-viewer__counter`, provider string `stepOfTotal`) in a polite live region.

Implementation: `src/components/media-viewer/media-viewer.tsx`, `src/components/media-viewer/media-stage.tsx`, `src/components/media-viewer/media-viewer-parts.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-1.3 - Thumbnails

With more than one item, the modal's footer shall hold a thumbnail strip (`ui-media-viewer__thumbnails`, a group named by the provider string `thumbnails`) with one `Button` per item (`ui-media-viewer__thumbnail`) named by the item's name and showing its `thumbnailUrl`, an image item's `src`, or else the glyph of its type (`ui-media-viewer__thumbnail-image`, `ui-media-viewer__thumbnail-icon`). The shown item's button carries `aria-current`; pressing a button shows its item.

Implementation: `src/components/media-viewer/media-viewer-parts.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-1.4 - Keyboard

Inside the viewer, Arrow Left and Arrow Right shall show the previous and next item (mirrored in a right-to-left locale), and `+` (or `=`) and `-` zoom an image in and out by the zoom control's levels. Presses with Control, Command or Alt, and presses inside an element that uses keys itself (an input, a text area, a select, editable content or a slider), are left alone.

Implementation: `src/components/media-viewer/media-layout.ts`, `src/components/media-viewer/media-viewer.tsx`, `src/components/modal/modal-dialog.tsx`
Verification: `src/components/media-viewer/media-layout.test.ts`, `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

## UIC-MEDIA-VIEWER-2 - Images

### UIC-MEDIA-VIEWER-2.1 - Fit, zoom and pan

An image item (type `image/*`, or no type) shall draw as an `<img>` (`ui-media-viewer__image`) inside a canvas (`ui-media-viewer__canvas`) inside the viewport (`ui-media-viewer__viewport`). Once the image has loaded, at 100% it fits inside the viewport's client box and is never drawn larger than its own size; the header's `ZoomControl` (`ui-media-viewer__zoom`, reset to 100%) scales that fit. The canvas takes the turned image's size and the image is centred in it, both with functional inline sizes and positions (`layoutMedia`), so a zoomed image larger than the viewport scrolls to pan.

Implementation: `src/components/media-viewer/media-stage.tsx`, `src/components/media-viewer/media-layout.ts`, `src/components/media-viewer/media-viewer-parts.tsx`
Verification: `src/components/media-viewer/media-layout.test.ts`, `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-2.2 - Rotate

The header's rotate button (`ui-media-viewer__rotate`, `rotate` glyph, provider string `rotateClockwise`) shall turn an image a quarter turn clockwise; a sideways image fits and scrolls by its turned size.

Implementation: `src/components/media-viewer/media-viewer.tsx`, `src/components/media-viewer/media-layout.ts`, `src/core/glyphs.tsx`
Verification: `src/components/media-viewer/media-layout.test.ts`, `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-2.3 - A fresh view per item

Moving to another item shall show it at 100% and unturned.

Implementation: `src/components/media-viewer/media-viewer.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`

## UIC-MEDIA-VIEWER-3 - Other files

### UIC-MEDIA-VIEWER-3.1 - Caller rendering

An item that is not an image shall show what `renderItem` returns for it (`ui-media-viewer__content`), such as a `PdfViewer`, without the zoom and rotate controls. The stage publishes `data-kind`: `image` or `file`.

Implementation: `src/components/media-viewer/media-stage.tsx`, `src/components/media-viewer/media-viewer-parts.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-3.2 - Fallback

When `renderItem` is missing or returns nothing for such an item, the viewport shall show the glyph of its type (`ui-media-viewer__fallback-icon`) and the provider string `previewUnavailable` (`ui-media-viewer__fallback`).

Implementation: `src/components/media-viewer/media-stage.tsx`, `src/core/strings.ts`
Verification: `src/components/media-viewer/media-viewer.test.tsx`

## UIC-MEDIA-VIEWER-4 - Accessibility and hooks

### UIC-MEDIA-VIEWER-4.1 - Named stage and focus

The viewport shall be a focusable group named by the provider string `mediaStage` with the item's name, which takes focus when the viewer opens, so the arrow keys work at once and a zoomed image scrolls from the keyboard. An image is named by its `alt`, else its `name`; the thumbnails' images and glyphs are decorative, since their buttons are named.

Implementation: `src/components/media-viewer/media-stage.tsx`, `src/components/media-viewer/media-viewer.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-4.2 - Download

An item with a `downloadUrl` shall offer a Download link in the header (`ui-media-viewer__download`, a `Link` with the `download` glyph named by the provider string `downloadFile`) that downloads it under the item's name.

Implementation: `src/components/media-viewer/media-viewer-parts.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`, `e2e/media-viewer.spec.ts`

### UIC-MEDIA-VIEWER-4.3 - Hooks and caller attributes

`MediaViewer` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on the modal's root.

Implementation: `src/components/media-viewer/media-viewer.tsx`
Verification: `src/components/media-viewer/media-viewer.test.tsx`

## Hooks

| Hook                               | Kind  | Values          | Description                                                     |
| ---------------------------------- | ----- | --------------- | --------------------------------------------------------------- |
| `ui-media-viewer`                  | root  |                 | The modal's overlay (also `ui-modal`).                          |
| `ui-media-viewer__stage`           | slot  |                 | The previous button, the viewport and the next button.          |
| `ui-media-viewer__previous`        | slot  |                 | The previous button (also `ui-icon-button`).                    |
| `ui-media-viewer__next`            | slot  |                 | The next button (also `ui-icon-button`).                        |
| `ui-media-viewer__viewport`        | slot  |                 | The focusable area that holds the item and scrolls.             |
| `ui-media-viewer__canvas`          | slot  |                 | The box of the turned image; sized inline once the image loads. |
| `ui-media-viewer__image`           | slot  |                 | The image; sized, centred and turned inline.                    |
| `ui-media-viewer__content`         | slot  |                 | The caller's rendering of a file that is not an image.          |
| `ui-media-viewer__fallback`        | slot  |                 | Stands in for a file without a rendering.                       |
| `ui-media-viewer__fallback-icon`   | slot  |                 | The fallback's type glyph (also `ui-icon`).                     |
| `ui-media-viewer__counter`         | slot  |                 | The position in the set.                                        |
| `ui-media-viewer__zoom`            | slot  |                 | The zoom control (also `ui-zoom-control`).                      |
| `ui-media-viewer__rotate`          | slot  |                 | The rotate button (also `ui-icon-button`).                      |
| `ui-media-viewer__download`        | slot  |                 | The Download link (also `ui-link`).                             |
| `ui-media-viewer__thumbnails`      | slot  |                 | The thumbnail strip.                                            |
| `ui-media-viewer__thumbnail`       | slot  |                 | One thumbnail button (also `ui-button`).                        |
| `ui-media-viewer__thumbnail-image` | slot  |                 | A thumbnail's image.                                            |
| `ui-media-viewer__thumbnail-icon`  | slot  |                 | A thumbnail's type glyph (also `ui-icon`).                      |
| `data-kind`                        | state | `image`, `file` | On the stage: whether the viewer draws the item as an image.    |
