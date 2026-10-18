---
'@flamboyantengineer/ui-components': minor
---

Declare the public API of the collections and data views (`Table`, `Tree`, `ListView`, `Card`, `CardGrid`, `FolderManager`, `PropertyPanel`) in library terms, so no public declaration exposes a React Aria type.

- New shared prop groups in `core`: `CollectionSelectionProps` (the selection props plus `selectionBehavior`), `SelectionBehavior` and `ExpansionProps` (`expandedKeys`, `defaultExpandedKeys`, `onExpandedChange`).
- `ListView` takes `items` with a render function or static children, `dependencies`, `onAction`, `reorder` (`{ onMove }` reporting a `ListViewMove`), `virtualized` with `rowHeight`, `onLoadMore` with `isLoading` (a `ui-list-view__loader` row) and `renderEmptyState`. New types: `ListViewMove`, `ListViewReorderOptions`, `ListViewChildren`.
- `CardGrid` takes `items`, `dependencies`, `onAction`, `layout` (`grid` or `waterfall`), `virtualized`, `minItemSize`, `onLoadMore` with `isLoading` (a `ui-card-grid__loader` item) and `renderEmptyState`; `CardGridItem` takes `id`, `textValue`, `href`, `onAction` and children or a function of `CardGridItemState`. New types: `CardGridLayout`, `CardGridItemSize`, `CardGridItemState`.
- `CardTitle` and `CardAction` (new) are the title and the whole-card action of a custom card header.
- `Table` declares its labelling, selection, expansion, `onRowAction` and `treeColumn` props; `Tree` declares its labelling, selection, expansion and `onAction` props, and `TreeItemState` lists its states.
- `PropertyPanel` takes `ExpansionProps` and `allowsMultipleExpanded`; `PropertySection` and `PropertyCard` declare `isExpanded`, `defaultExpanded` and `onExpandedChange`.

Breaking:

- `ListView` no longer takes `dragAndDropHooks`; use `reorder={{ onMove }}` and apply the reported move. The list draws its own drop indicator, and a drop on a row or beside a dragged row is refused.
- `ListView` and `CardGrid` no longer take building-block collection children: use `virtualized`, `layout`, `onLoadMore` and `isLoading` instead of a `Virtualizer`, `ListLayout`, `GridLayout`, `WaterfallLayout` or `GridListLoadMoreItem`. `renderEmptyState` takes no arguments.
- `ListViewItemProps` and `CardGridItemProps` are no longer generic; their React Aria pass-through props (other than those listed above) are gone. `CardGridItem`'s render function receives `{ isSelected }` only.
- A custom card header names the card with `CardTitle` and draws its action with `CardAction`, in place of React Aria's `Heading slot="title"`, `Link slot="action"`, `Button slot="action"` and `useSlottedContext(HeadingContext, 'title')`.
- `Table`, `Tree`, `ListView` and `CardGrid` no longer pass undeclared React Aria props through; `Tree` drops `dependencies`. `PropertySection` and `PropertyCard` drop undeclared disclosure props, and `PropertyCard` drops `hidden`.
- `Key`, `Selection`, `SortDescriptor` and `SortDirection` in these components' signatures are the library's types from `core`.
