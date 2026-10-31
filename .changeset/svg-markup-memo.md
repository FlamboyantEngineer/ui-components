---
'@flamboyantengineer/ui-components': minor
---

`parseSvgMarkup` returns `null` for markup without a root `<svg>` element instead of throwing, and caches that result too. `SvgMarkup` parses its markup and scopes its references only when `markup` changes, so re-rendering with a new label or class no longer re-walks the drawing.
