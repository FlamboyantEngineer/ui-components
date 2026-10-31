---
'@flamboyantengineer/ui-components': minor
---

Removed public exports that nothing used: the hand-rolled submenu solver (`resolveSubmenuPlacement`, `DEFAULT_SUBMENU_OVERLAP` and the `Submenu*` types; menus use React Aria submenus), `isSameOverlayGeometry` (use `isShallowEqual`), `toOverlayRect`, the scroll-overview helpers (`buildScrollOverviewImage`, `resolveScrollOverviewSegments`, `resolveLayeredScrollOverviewSegments`, `SCROLL_OVERVIEW_MIN_MARKER`), `DEFAULT_COPY_TIMEOUT`, `DEFAULT_SCROLLBAR_HIDE_DELAY`, `MIN_THUMB_SIZE`, `THUMB_ARROW_STEP`, `RESIZE_KEYBOARD_STEP`, `RESIZE_KEYBOARD_FINE_STEP`, `defaultLayerZIndex` and `findNearestZoomLevelIndex`. `resolveOverflowCount` is exported from the utilities entry only. The documented helpers that stay public are shown in their labs.
