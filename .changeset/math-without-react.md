---
'@flamboyantengineer/ui-components': minor
---

Add `sanitizeMathMarkup(markup, ownerDocument)` and `renderMathElement(source, { displayMode, renderer, ownerDocument })` to the `math-preview` entry point: the preview's MathML allow-list and typesetting to a sanitized element, without React. `renderMathElement` never throws, and answers `{ ok: false, message }` when KaTeX is not installed.
