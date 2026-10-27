---
'@flamboyantengineer/ui-components': minor
---

Interactive overlays are observable. `useOverlayPresence()` returns an `OverlayPresence` (`isActive()`, `getCount()`, `subscribe()`) for code that reads it synchronously, such as a page-wide shortcut, and `useIsOverlayActive()` re-renders when an overlay opens or closes. Menus and submenus, field popups (select, combobox, completion, calendar, relative date, color, emoji) and popovers count; tooltips, hover cards and toasts do not. The outermost `UiProvider` holds one presence for its tree.
