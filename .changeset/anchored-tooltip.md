---
'@flamboyantengineer/ui-components': minor
---

`AnchoredTooltip` shows the tooltip panel, opened and closed by the caller, against an element the caller already owns (an HTML or SVG element, or a ref) or a rectangle with no element (`getBoundingClientRect()`), without a trigger of its own. It follows its anchor through scrolling and resizing, and while open adds its panel to an element anchor's `aria-describedby` or `aria-labelledby` beside the ids already there, or stays visual only with `relationship="none"`.
