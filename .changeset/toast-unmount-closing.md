---
'@flamboyantengineer/ui-components': patch
---

A closing toast whose region or list unmounts before its exit ends, such as when its action leaves the page, is now removed and calls its `onClose` once instead of staying queued.
