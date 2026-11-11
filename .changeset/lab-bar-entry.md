---
'@flamboyantengineer/ui-components': minor
---

A new `@flamboyantengineer/ui-components/labs` entry point gives libraries built on this one the same lab toolbar: `LabBar` (the page title, an "All labs" link that carries the settings, the stylesheet picker and a theme switch), `mountLabBar` to render it in an isolated shadow root and keep the page, its query string and the remembered choice in step, and `bootLabSettings` to apply the stylesheet and theme from the page head before the first paint. The theme switch is a `SegmentedChoice` with icons, drawn by the new `ThemeSystemGlyph`, `ThemeLightGlyph` and `ThemeDarkGlyph` glyphs (`theme-system`, `theme-light`, `theme-dark`).
