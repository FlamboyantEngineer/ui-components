---
'@flamboyantengineer/ui-components': minor
---

Scroll edge fades are opt-in. `ScrollRegion`, `DockPanel`, `ToolbarScroller`, `ToolbarRow` and `ChatList` take `showEdgeFades`, off by default. `ScrollRegion` and `ChatList` publish `data-edge-fades` with it, and the reference stylesheet fades scrolled edges, or a chat list's last rows above Load more, only then. `DockPanel`, `ToolbarScroller` and `ToolbarRow` render their `__fade` elements only with it. Edge distances and `data-overflow-*` states are still published either way. Without a fade, the reference stylesheet gives a toolbar's resting scroll chevron the canvas behind it.
