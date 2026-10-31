---
'@flamboyantengineer/ui-components': patch
---

FolderManager ends a rename or new folder, without calling back, when its folder or parent leaves `folders` or its callback goes, so the manager is no longer stuck busy.
