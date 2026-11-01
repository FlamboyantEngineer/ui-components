---
'@flamboyantengineer/ui-components': patch
---

A save InlineEdit schedules when focus leaves the editor belongs to its editing session: if the owner closes or reopens the editor before it runs, it saves and closes nothing.
