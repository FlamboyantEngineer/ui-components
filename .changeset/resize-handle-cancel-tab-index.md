---
'@flamboyantengineer/ui-components': minor
---

`ResizeHandle` keeps a caller's `tabIndex`, so a handle can stay pointer-only out of the tab order, and measures its scale from the nearest laid-out ancestor. A pointer cancellation or a lost capture now abandons the drag through `onChangeCancel` instead of ending it, and `ResizableSplitView` returns to its sizes from before the drag.
