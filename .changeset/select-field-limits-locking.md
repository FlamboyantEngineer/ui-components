---
'@flamboyantengineer/ui-components': patch
---

`SelectField` fixes. `maxValues` counts values rather than known options, so restoring a missing committed value cannot exceed it. An open select that turns disabled or read-only closes through `onOpenChange(false)` and stays closed once it unlocks, in both list and tree modes. The latest loaded version of a remote option now wins over seed `options` in its row, trigger and chip. Keys owned by an input method composition (including key code 229) are left to it on the closed trigger and in the tree popover.
