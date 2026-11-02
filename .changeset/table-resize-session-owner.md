---
'@flamboyantengineer/ui-components': patch
---

A static `Table`'s column resize is cancelled when the widths change owner (the storage adapter or `persistKey`) or its resizer goes (the column is removed, hidden, stops allowing resizing, or the table becomes virtualized): the preview is dropped, pointer capture released and the grid's arrow keys restored, and nothing is kept or reported under either owner.
