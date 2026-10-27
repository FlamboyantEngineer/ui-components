---
'@flamboyantengineer/ui-components': minor
---

`Table` takes `cellWrap` (`nowrap` by default, `wrap` or `anywhere`) for how its cells wrap their text, and a column's own `cellWrap` overrides it. Data, summary and group aggregate cells publish the resolved mode as `data-wrap`, so a stylesheet keeps one line, wraps prose, or also breaks long unspaced values such as identifiers. The new `TableCellWrap` type names the modes.
