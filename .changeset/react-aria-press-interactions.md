---
'@flamboyantengineer/ui-components': patch
---

CompletionList options and GridSizePicker cells use React Aria's press and hover interactions: a press dragged off before release or a cancelled touch no longer acts, and touch no longer previews by hovering. RelationMatrix documents its own grid and keyboard contract, and looks up its `related` text once per row.
