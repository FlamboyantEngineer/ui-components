---
'@flamboyantengineer/ui-components': minor
---

Layout presentation changes keep children mounted. `Stack` and `Cluster` keep each child's keyed place whether `divided` is on or off. `ToolbarRow` now always holds its controls in a `ui-toolbar-row__strip` element, which carries the row's role, name and `ref`, so moving between `wrap`, `scroll` and `none` or changing the orientation keeps every control's state and focus. A scrolling row draws its own `ui-toolbar-row__fade` and `ui-toolbar-row__scroll-button` edges, with `data-overflow-start` and `data-overflow-end` on its root, instead of nesting a `ToolbarScroller`. Stylesheets lay the controls out in the strip.
