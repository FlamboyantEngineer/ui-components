---
'@flamboyantengineer/ui-components': minor
---

Shared parts carry the `data-slot` names of the shadcn/ui component that draws them: `AlertDialog` (and any `role="alertdialog"` dialog) writes `alert-dialog-*`, `Sheet` writes `sheet-*`, context menus `context-menu-*`, menubar menus `menubar-*`, the command palette's list `command-list`, `command-item`, `command-group`, `command-shortcut` and `command-separator`, and a multiple combobox's chips `combobox-chip`, `combobox-chip-remove` and `combobox-chip-input`. Hook classes do not change. A `Shortcut` now keeps a caller's `data-slot`.
