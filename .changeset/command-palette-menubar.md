---
'@flamboyantengineer/ui-components': minor
---

Add a command palette and a menubar.

- `CommandPalette` (new, React Aria `ModalOverlay`, `Dialog`, `SearchField` and `Autocomplete` over the library `Menu`): a modal search field over a menu of commands from `items` or `children`, opened by a document-wide `shortcut` (`Ctrl+K` by default, Command+K on macOS; `null` for none) or `isOpen`/`defaultOpen`/`onOpenChange`. It filters ignoring case and accents (`filter` replaces the test, `null` keeps every command), marks the typed text in labels, shows `renderEmptyState` or the `noResults` string while nothing matches, takes `inputValue`/`defaultInputValue`/`onInputChange` and `isLoading` for results fetched as the reader types, runs `onAction` and closes, and returns focus to where it was. Props `aria-label`, `placeholder` and `size`. Hooks: `ui-command-palette`, `__panel`, `__dialog`, `__search`, `__search-icon`, `__search-input`, `__empty`, `data-layer`, `data-size`.
- `Menubar` and `MenubarMenu` (new, React Aria `MenuTrigger` and `Button` with the library menu family): a `role="menubar"` row or column (`orientation`, `size`) of top-level items that each open a menu of items, sections, separators, checkable items, shortcuts and submenus, with one tab stop, the menubar arrow keys (moving along the bar and from one open menu to the next), and pointer switching between open menus. Hooks: `ui-menubar`, `__trigger`, `data-orientation`, `data-size`, `data-open`.
- `Menu`: `highlightMatches` marks the text typed in the enclosing search field (its own with `filterable`, or a command palette's) in the labels of its data entries and their submenus, and in `TextMatch` children.
- Provider strings: `commandPalette` and `searchCommands`.
