---
'@flamboyantengineer/ui-components': minor
---

Scroll edge fades stay on by default and can be turned off. `ScrollRegion`, `DockPanel`, `ToolbarScroller`, `ToolbarRow` and `ChatList` take `showEdgeFades`, `true` by default. With `showEdgeFades={false}`, `ScrollRegion` and `ChatList` leave out `data-edge-fades`, so the reference stylesheet draws no fade over scrolled edges or a chat list's last rows above Load more, and `DockPanel`, `ToolbarScroller` and `ToolbarRow` render no `__fade` elements. Edge distances and `data-overflow-*` states are published either way. Without a fade, the reference stylesheet gives a toolbar's resting scroll chevron the canvas behind it.
