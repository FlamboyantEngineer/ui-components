---
'@flamboyantengineer/ui-components': minor
---

Add `ImageHotspots`: a zoomable, scrollable image with rectangular hotspot buttons placed in percent of the image's intrinsic size, so they stay aligned at every zoom and viewport size. Each hotspot takes a stable key, an accessible name, pressed and disabled states and an advisory tone and message; a press passes only its key to `onAction`, and the caller's state may show on several hotspots at once. Import it from the root or `@flamboyantengineer/ui-components/image-hotspots`.
