---
'@flamboyantengineer/ui-components': patch
---

`InlineEdit` no longer drops text typed while a save runs: the editor stays open with the newer value once the save ends, and Enter or blur meanwhile saves it after the first save. Each editing session has its own identity, so a save that settles after its controlled session closed and reopened, or after unmount, closes, clears and reports nothing.
