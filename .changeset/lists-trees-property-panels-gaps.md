---
'@flamboyantengineer/ui-components': minor
---

Close gaps in the list, tree and property panel components.

- `ListView`, `ListViewItem` and `ListViewSection` (new, in the list row family, on React Aria `GridList`): single or multiple selection with checkboxes, typeahead, sections under header rows (`stickyHeaders`), drag and drop through React Aria's `dragAndDropHooks` with a drag handle per row, and `Virtualizer`/`GridListLoadMoreItem` children. Rows draw the `ListRowContent` text and `trailing` controls. Hooks: `ui-list-view` (`__drop-indicator`, `data-divided`, `data-sticky-headers`), `ui-list-view-item` (`__drag-handle`, `__checkbox`, `__trailing`, `data-tone`), `ui-list-view-section` (`__header`).
- `Tree`: `checkboxSelection` draws a selection checkbox per row (`__checkbox`); `selectionPropagation` cascades selection through loaded descendants and marks partial branches with `data-indeterminate`; `filterText` and `filter` show matching rows with their ancestors opened and mark the matched text; `onLoadChildren` loads a branch when its loading row comes into view and shows a failure with a retry in the row (`__load-error`); `onRename` and `canRename` rename a row in place with F2 (`__rename-input`); `reorder.onMoveMany` drags several selected rows together. `resolveTreeDropMany` (new) resolves such drops.
- `PropertyPanel`: `expandedKeys`, `defaultExpandedKeys`, `onExpandedChange` and `allowsMultipleExpanded` open and close its sections as a group (accordion, expand or collapse all) through React Aria's `DisclosureGroup`, keyed by the new `PropertySection` `id`; `isDisabled` and `isReadOnly` lock every field inside (`data-disabled`, `data-readonly`). The field scope gains `isReadOnly`.
- `PropertyScope` and `PropertyFilter`: `filter` replaces term matching; `PropertyFilter` takes `query`, `defaultQuery` and `onQueryChange`.
- `FourSidePropertyStrip`: `sides="logical"` edits block and inline start and end, which follow the writing direction; `value`, `defaultValue` and `onChange` hold the values, handed to `renderSide` as a second `field` argument; `link` (`all`, `pairs`) draws a link toggle (`__link`, `isLinked`, `defaultLinked`, `onLinkedChange`, `data-linked`) so one edit sets all four sides or each opposite pair.
- Provider: the `link` glyph and the `logicalBoxSide` and `linkSides` strings.
