---
'@flamboyantengineer/ui-components': patch
---

`SvgMarkup` scopes animation timing that names numeric, accented or escaped IDs (`7.click`, `ñu.end`, `a\.b.click`), and drops such timing when it names an element outside the drawing. The instance prefix now holds only word characters, so scoped timing such as `id.click` also starts in Chromium, which read the old `-` in the prefix as an offset.
