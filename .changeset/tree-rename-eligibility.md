---
'@flamboyantengineer/ui-components': patch
---

`Tree` renames the row as it is now: Enter and leaving the name field check `disabledKeys` and `canRename` again and pass the current item to `onRename`, and a row that becomes disabled, leaves the tree or stops taking renames closes its field without renaming.
