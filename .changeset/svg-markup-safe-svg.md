---
'@flamboyantengineer/ui-components': patch
---

`SvgMarkup` and `parseSvgMarkup` now treat markup as untrusted and keep only an allowlist of SVG elements, attributes and values. Links are unwrapped, `<style>` and unknown elements are dropped, `<title>` and `<desc>` keep text only, and links, images and `url()` values may only point inside the drawing (images may also embed raster data URLs), so server- and client-rendered drawings can no longer run script or load remote resources.
