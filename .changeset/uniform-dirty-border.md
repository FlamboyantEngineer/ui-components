---
'@flamboyantengineer/ui-components': patch
---

Reference stylesheet: a changed, unsaved field now colours its whole frame with the new `--ref-dirty` token (or takes `--ref-dirty-outline` where it has no frame), instead of a 3px bar on its inline-start edge on some fields and a ring on others; the rich text editor gains the same mark. `npm run check:labs` rejects other dirty marks.
