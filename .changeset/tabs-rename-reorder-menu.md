---
'@flamboyantengineer/ui-components': minor
---

Let tabs be renamed, reordered and remembered, and give each tab a menu of its actions.

- `TabList` `onRename` renames a tab in place: a double click, F2 or the tab menu opens a name field laid over the tab; Enter or leaving the field renames it, Escape keeps the old name. `validateName` refuses a name with a message shown beside the field. Hooks: `__rename`, `__rename-input`, `__rename-error`, `data-renaming`, `data-invalid`.
- `TabList` `onReorder` reports a `TabMove` (`key`, `targetKey`, `position`) when a tab is dragged beside another (React Aria drag and drop) or moved with Alt+Arrow keys. Hooks: `data-dragging`, `data-drop-position` (`before`, `after`).
- `TabList` `getMenuItems` opens a context menu on each tab (secondary click, long touch, Context Menu key or Shift+F10) from the standard entries for the list's actions (Rename, Duplicate, Move left or right, Delete), which the owner may change or extend; `onDuplicate` offers Duplicate.
- Tabs announce the keys their list takes in `aria-keyshortcuts` (`Delete`, `F2`, `Alt+Arrow…`, `Shift+F10`).
- `Tabs` `persistKey` remembers the selected tab through the provider's storage adapter.
- New types: `TabMove`, `TabMenuItems`, `TabNameValidate`.
- Provider strings: `duplicate` and `moveItem`. Glyphs: `arrow-left` and `arrow-right`.
