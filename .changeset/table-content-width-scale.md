---
'@flamboyantengineer/ui-components': patch
---

`Table` measures `width: 'content'` columns in layout pixels: an ancestor `transform` scale or CSS `zoom` no longer scales the measured track a second time, so content widths stay the same at any scale.
