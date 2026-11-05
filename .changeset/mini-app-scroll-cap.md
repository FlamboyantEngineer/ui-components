---
'@flamboyantengineer/ui-components': patch
---

A `MiniApp` document no longer scrolls vertically unless the host stylesheet holds its frame shorter than its content. An empty scrollbar narrowed charts whose height follows their width, so they kept a scrollbar with no thumb.
