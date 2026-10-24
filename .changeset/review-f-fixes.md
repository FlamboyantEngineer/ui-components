---
'@flamboyantengineer/ui-components': minor
---

- Tabs: a `Tab` rendered through a host component that forwards its props keeps its `id` again, so `selectedKey`, `defaultSelectedKey`, `disabledKeys`, its `TabPanel`, `aria-controls` and the remove, rename, reorder and menu callbacks all reach it. `data-key` is documented as React Aria's opaque collection key, not the tab's `id`; its values changed to encoded keys in the previous release.
- Tag Group: a `Tag` rendered through a host component, as a child or for each of `items`, keeps its `id` for selection, disabled keys and removal. `data-key` is documented as an opaque collection key.
- List View: a `ListViewItem` or `ListViewSection` rendered through a host component, as a child or for each of `items`, keeps its `id` for selection, disabled keys and callbacks. Link rows declare the `data-href` hook React Aria already writes, and `data-key` is documented as an opaque collection key, not the row's `id`.
- List: the tab stop stays on the first row while rows are added, moved or removed until focus enters the list, and mounting many rows no longer slows down with the square of their number.
- Menu: a `MenuItem` or `MenuSection` rendered through a host component keeps its `id` for selection, disabled keys and `onAction`. `data-key` is documented as an opaque collection key.
- Table: a dragged row carries its own `id` as text instead of its encoded key, and the drag preview shows exactly the dragged rows. The `data-key-identity` row hook added in the previous release is removed; `data-key` is documented as an opaque collection key.
- Tree: with `selectionPropagation` in single selection a press selects that row alone instead of also selecting its descendants. `data-key` is documented as an opaque collection key.
- Select Field, Combobox, Character Grid and Board: `data-key` is documented as an opaque collection key, not the caller's `id`.
- Pivot Table: the one row without row fields marks its column totals with `data-total`; `NaN` and infinite values group as their text instead of joining the empty group; group rows' `data-key` values change, while expanded keys stay the group keys.
- Facet List: the label is exposed as a heading at the automatic section level; a query no longer keeps narrowing the values after its search field disappears; ticking a value keeps ticked values that no option shows.
- Inline Edit: a controlled editor its owner closes and reopens starts again from the saved value, without the abandoned draft or the last failure.
- Record Header: the editable title's heading is named by the title alone.
- Transfer List: selecting, filtering or moving no longer redraws every row of both sides, and each side's count describes its list.
- Drag Handle: `excludeFromTabOrder={undefined}` keeps the handle out of the tab order.
- Change List: a list change from or to an empty text draws no empty item, and `renderEmptyState` returning `null` renders nothing.
