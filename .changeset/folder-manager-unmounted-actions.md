---
'@flamboyantengineer/ui-components': patch
---

`FolderManager` no longer calls `onSelectionChange`, moves focus or shows a message when a create, rename or delete settles after the manager has unmounted. The host's work still completes.
