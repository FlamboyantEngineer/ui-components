---
'@flamboyantengineer/ui-components': patch
---

`PinInput` applies native deletions: Delete or Cut on a cell's selected character removes it and closes the gap, reporting the shorter code through `onChange` and the form value instead of putting the character back.
