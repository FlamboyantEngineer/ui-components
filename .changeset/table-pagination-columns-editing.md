---
'@flamboyantengineer/ui-components': minor
---

Close gaps in `Table` and `DragHandle`, and add `Pagination`.

- `Pagination` (new): previous and next buttons around page buttons with gaps for skipped pages, built on `Button` and `IconButton`; `pageCount`, `page`, `defaultPage`, `onPageChange`, `isDisabled`. Hooks: `ui-pagination`, `__list`, `__item`, `__previous`, `__next`, `__page`, `__ellipsis`, `data-current`, `data-disabled`.
- `Table` sorting: `sortDescriptors`, `defaultSortDescriptors` and `onSortDescriptorsChange` sort by several columns (Shift adds a column); `sortTableRows` takes a list. Hook: `data-sort-priority`.
- `Table` filtering: one filter object (`query` and column values) through `filter`, `defaultFilter` and `onFilterChange`, owned by the caller for server filtering; typed column filters (`filter: { type: 'text' | 'number' | 'date' | 'set' }`) from a header button and an anchored dialog; `filterTableRows` is exported. Hooks: `__column-filter`, `__column-filter-dialog`, `data-filtered`.
- `Table` columns: `pin` (`start`, `end`), `allowsHiding` with a columns menu, `allowsReordering` by dragging a header or Alt+Arrow keys, `columnGroups`, and `columnLayout`, `defaultColumnLayout` and `onColumnLayoutChange` for the order and hidden columns, persisted under `<persistKey>:layout`. Hooks: `__toolbar`, `__columns-menu`, `__column-group`, `data-pinned`, `data-allows-reordering`, `data-drop-position`, `data-ungrouped`, `--ui-table-pin-offset`.
- `Table` rows: `getChildRows` for nested rows and `renderRowDetail` for detail rows on React Aria's expandable rows (`treeColumn`, `expandedKeys`); cell editing with `allowsEditing`, `renderEditor` and `onCellEdit`; a summary row from `renderFooter`; `pagination` (`pageSize`, `page`, `rowCount`); and `onLoadMore` with `isLoading`. Hooks: `__expand`, `__expand-spacer`, `__detail-row`, `__detail-cell`, `__editor`, `__footer`, `__footer-row`, `__footer-cell`, `__loader`, `__pagination`, `data-editing`, `--ui-table-level`.
- `Table` reordering: `reorder.dragTrigger="handle"` drags rows by their handles only, and `reorder.renderDragPreview` draws the drag image (`__drag-preview`, `data-count`). A pointer drag now also starts from the cell that holds a row's handle.
- `DragHandle`: `armHandleDrag` and `keepHandleCellDraggable` for collections that drag by handle or from the handle's cell.
- The search field of a filterable table now sits inside the new `ui-table__toolbar` element.
- Provider: the `filter` glyph and the strings `pagination`, `paginationOf`, `pageNumber`, `columns`, `contains`, `rangeFrom`, `rangeTo` and `summary`.
