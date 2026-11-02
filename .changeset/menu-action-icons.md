---
'@flamboyantengineer/ui-components': minor
---

Built-in menu actions take host icons. `Field` and every field built on it, `SignaturePad`, `TabList`, `ConditionBuilder`, `RelationMatrix`, `ChatMessageActionsMenu`, `FolderManager` and `PdfViewer` gain `menuIcons`, `CalendarView` gains `eventMenuIcons`, `DashboardGrid` gains `tileMenuIcons` and `Chat` gains `messageMenuIcons`: a map of icons by action name, where an icon replaces the action's own and `null` removes it, without changing the action. `MenuActionIcons` and `resolveActionIcon` let other menus follow the same rule. The reference stylesheet lines up the labels of rows without an icon in a menu where other rows have one.
