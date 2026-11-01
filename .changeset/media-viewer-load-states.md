---
'@flamboyantengineer/ui-components': minor
---

MediaViewer:
- shows a loading status while the shown image loads, and replaces an image that fails with an alert and a Retry button; the new `onImageError` callback receives the item so the host can give it a fresh `src`. Zoom and rotate wait for a loaded image, and the stage publishes `data-status` (`loading`, `loaded`, `failed`). A report from an earlier request or another item changes nothing.
- keys the caller's `renderItem` content by the item's typed id, so state never carries from one file to another; focus inside a replaced rendering moves to the viewport.
- holds its own open state, so a list that empties and refills neither reopens a closed viewer nor forgets an open one.
- loads thumbnails lazily, so opening a large set no longer requests every image.
