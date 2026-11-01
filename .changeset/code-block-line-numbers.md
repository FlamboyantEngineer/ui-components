---
'@flamboyantengineer/ui-components': minor
---

CodeBlock gains `lineNumbers`, which numbers each line in a gutter the stylesheet draws from `data-line-number`, so the numbers stay out of the text, a selection and Copy, and `wrap` (`off` or `soft`), published as `data-wrap`. Code that is taller than a height the host sets now also joins the tab order, so the keyboard can scroll it down. `resolveCodeTokenizer` is now exported, so a CodeBlock can highlight with the CodeEditor language presets or custom syntax rules.
