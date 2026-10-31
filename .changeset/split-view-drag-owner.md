---
'@flamboyantengineer/ui-components': minor
---

SplitView abandons a drag when its storage, `persistKey` or pane bounds change mid-drag, so the old preview is never saved under the new key, and keeps reopening sizes per key. `ResizeHandle` takes `resetKey`, whose change abandons a drag in progress.
