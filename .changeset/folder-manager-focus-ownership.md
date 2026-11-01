---
'@flamboyantengineer/ui-components': patch
---

FolderManager restores focus after an edit or delete only while the manager still owns it: focus the reader moved elsewhere while a callback was pending, or while a new folder's row was still to arrive, stays put, and a new edit drops a row still awaited.
