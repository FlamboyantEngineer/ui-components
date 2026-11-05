---
'@flamboyantengineer/ui-components': minor
---

Add `MathPreview` and `MathField` in a new `math-preview` entry point. `MathPreview` typesets LaTeX source as MathML, inline or as display math, with empty, pending, invalid and stale states; `MathField` pairs a LaTeX source editor with a live preview, following the field value contract. The default renderer, `renderKatexMath`, loads [KaTeX](https://katex.org) on first use, which is a new optional peer: hosts that import nothing from `math-preview` need no KaTeX. KaTeX runs with `trust` off and bounded sizes and macro expansion, and every renderer's markup passes through a MathML allow-list, so links, styles, classes and HTML never render. Adds the `mathPending`, `mathTooLong` and `mathPreview` strings.
