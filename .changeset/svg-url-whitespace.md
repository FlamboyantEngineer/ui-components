---
'@flamboyantengineer/ui-components': patch
---

`SvgMarkup` reads whitespace around an unquoted `url()` ID as CSS does, so a local reference such as `url(#paint )` keeps its fill, stroke, mask or filter instead of being dropped.
