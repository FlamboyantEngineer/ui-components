---
'@flamboyantengineer/ui-components': patch
---

`RichTextEditor`: `set-link` at a caret changes or removes the whole link, including its parts formatted differently before the caret. The numbered-list shortcut takes at most nine digits, so a typed list never stores an unsafe `start`. The form value is serialized as a deferred update instead of on every keystroke, and finding a dragged block's drop gap reads each block's position from a cache.
