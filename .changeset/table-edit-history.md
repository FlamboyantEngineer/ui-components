---
'@flamboyantengineer/ui-components': minor
---

`Table` undoes and redoes cell edits. `useTableEditHistory({ limit, resetKey })` returns a bounded history for the table's `editHistory`: each edit, paste, fill, clear or bulk edit the table reports becomes one entry of changes by row id and column, and `undo`/`redo` report the reverse or the same changes through `onCellsChange`. `canUndo` and `canRedo` drive toolbar buttons, and Control or Command with Z (Shift+Z or Y to redo) works on the grid while editors keep their own history. An entry applies only to cells that still hold the value it left, in rows still present and enabled and columns that still allow editing, so changes made elsewhere are never overwritten.
