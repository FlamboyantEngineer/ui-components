---
'@flamboyantengineer/ui-components': minor
---

DashboardGrid gets two context menus. `tileMenu` and `onTileAction` give each tile a menu with the built-in `move`, `resize` and `remove` actions (shown in edit mode only) plus any host entries. `spaceMenu` and `onSpaceAction` give the empty grid space a menu that tells the host which cell it was opened on. `useContextMenuTarget` takes a new `accepts` test, and `useMenuControllerState` is now exported from the context-menu module.
