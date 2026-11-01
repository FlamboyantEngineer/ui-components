---
'@flamboyantengineer/ui-components': patch
---

FolderManager checks every selected folder for a blocked reason before setting aside those inside another selected folder, so a locked folder selected inside a selected parent blocks the delete in the toolbar, the context menu and the Delete key.
