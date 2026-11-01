---
'@flamboyantengineer/ui-components': patch
---

`DockPanel`, `Wizard`, `MediaViewer`, `EmojiPicker` and `RelationMatrix` keep the pane, step, item, category or focused cell they showed first by its id: items added or reordered around it, a collection that loads after mounting, or a custom or recently used tab that arrives later no longer take its place. Keeping it reports no selection.
