---
'@flamboyantengineer/ui-components': patch
---

`SvgMarkup` now drops values whose `url()`, strings or brackets are not closed or are malformed, and values holding CSS comments, so a remote `url(` cut short at the end of a value no longer loads. The check covers presentation attributes, `style` declarations, custom properties and animation values.
