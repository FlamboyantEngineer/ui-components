---
'@flamboyantengineer/ui-components': patch
---

`parseSvgMarkup` and `SvgMarkup` keep whitespace inside `<text>` elements, so words in separate `<tspan>`s keep their space and `xml:space="preserve"` text keeps its spacing. Whitespace that only indents other elements is still dropped.
