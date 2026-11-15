---
'@flamboyantengineer/ui-components': minor
---

`ToolbarRow` takes `overflow="menu"` with tools given as data (`items`, each with `id`, `label`, `icon`, `isDisabled`, `onAction` and `priority`, drawn by `renderItem`). Only the tools that fit render; higher `priority` stays longest and equal priorities leave from the end; the others are listed in an icon-only "more" menu at the end of the toolbar, whose button the arrow keys reach. Changing `overflow` keeps the visible tools mounted, and focus on a tool that collapses moves to the next tool, else the menu button. `menu` without `items` and `renderItem` scrolls; a vertical row treats it as `none`. New hooks `ui-toolbar-row__item` and `ui-toolbar-row__overflow`, and the `ToolbarRowItem` type.
