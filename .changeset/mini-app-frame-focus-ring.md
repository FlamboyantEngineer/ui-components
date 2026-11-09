---
'@flamboyantengineer/ui-components': patch
---

`MiniApp` publishes `data-focus-visible` on its frame while the frame's focused element shows a focus ring, so the host draws a ring around the frame in browsers that never match `:focus-visible` on a frame whose document holds the focus.
