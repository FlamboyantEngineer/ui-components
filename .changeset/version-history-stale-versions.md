---
'@flamboyantengineer/ui-components': patch
---

VersionHistory keeps its dialogs and comparison to versions that are still there. A restore or rename dialog closes when its version leaves the list, becomes disabled (or current, for a restore), or its callback goes away, and it does not reopen when they come back. Compare counts only listed, enabled versions, and an uncontrolled selection drops a version that leaves or becomes disabled.
