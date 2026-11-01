---
'@flamboyantengineer/ui-components': minor
---

`ResizeHandle` abandons a drag when it unmounts or its orientation, sized pane or writing direction changes, and reports every abandoned drag through the new `onChangeCancel`. `NavigationRail` and `DockPanel` drop their live size and resizing state when the handle disappears or changes axis mid-drag.
