---
'@flamboyantengineer/ui-components': patch
---

A native form reset now puts SegmentedChoice back to the value it had when it mounted (and reports it through `onChange`), drops a pending change, and leaves a cancelled reset alone. FileUpload shares the same reset hook.
