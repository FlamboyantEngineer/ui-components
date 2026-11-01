---
'@flamboyantengineer/ui-components': patch
---

Gestures and overflow rows hold under an ancestor's `transform: scale()`: SplitView separators, ScrollRegion thumbs, Timeline bars, DashboardGrid tiles, DiagramCanvas pans, marquees, node moves and wheel zoom, and Toast swipes stay under the pointer; the RichTextEditor slash menu sits at the caret; and ActionRow, TabBar, Breadcrumb, OverflowList and ToolbarScroller rows keep as many items as unscaled.
