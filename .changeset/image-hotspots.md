---
'@flamboyantengineer/ui-components': minor
---

Add `ImageHotspots`: a zoomable, scrollable image with rectangular hotspot buttons placed in percent of the image's intrinsic size, so they stay aligned at every zoom and viewport size. Each hotspot takes a stable key, an accessible name, pressed and disabled states and an advisory tone and message; a press passes only its key to `onAction`, and the caller's state may show on several hotspots at once. It lays out, zooms (with opt-in `zoomsOnWheel`) and scrolls through the same zoomable viewport as `MediaViewer`, and tracks its image as `Image` does. Import it from the root or `@flamboyantengineer/ui-components/image-hotspots`.

`MediaViewer` now keeps the point at the viewport's centre in place when its zoom control or keys change the zoom.
