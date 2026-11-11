---
'@flamboyantengineer/ui-components': minor
---

Add 40 glyphs, each overridable through `UiProvider`: document formatting (`superscript`, `subscript`, `special-character`, `footnote`, `cross-reference`, `abbreviation`, `page-break`, `table-of-contents`), page and layout (`fit-height`, `page-portrait`, `page-landscape`, `layout-*`), table borders and cells (`table-border-*`, `merge-cells`, `unmerge-cells`), comments (`chat-bubble-check`, `-plus`, `-trash`, `-x-mark`), `article`, `library`, `bars-3-bar`, `bars-3-center-middle`, and file types (`file-image`, `file-video`, `file-audio`, `file-document`, `file-data`, `file-spreadsheet`). Glyphs may now draw several strokes with their own width and dashes.

The `warning`, `save`, `drag-handle`, `fit-width` and file glyphs have new default drawings, and `getFileGlyph` now returns `file-image`, `file-video` and `file-audio` for those families instead of `image`, `video` and `audio`.
