---
'@flamboyantengineer/ui-components': minor
---

Reset buttons are opt-in. A field draws its restore button only with the new `showRestoreButton` prop, on `Field` and on every field built on it. The same prop also gates the restore buttons of `FieldPreviousValue` markers, such as a select's removed chips and a file field's removed files. `DiagramCanvas` draws its zoom reset button only with the new `showZoomReset` prop. Reset in a field's context menu is unchanged. To keep the previous behaviour, pass `showRestoreButton` or `showZoomReset`.
