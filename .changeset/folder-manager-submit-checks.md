---
'@flamboyantengineer/ui-components': patch
---

FolderManager checks the loading state and the depth limit again when a name is submitted: while the folders load the submit waits with the field and its text kept, and a new folder whose parent no longer fits the limit is refused with the limit as the message instead of calling `onCreate`.
