---
'@flamboyantengineer/ui-components': minor
---

Close gaps in the action and navigation components.

- `Button` and `IconButton` keep React Aria's `render` for the `<button>`, render a link with `href` (`target`, `rel`) drawn through the provider's link renderer, and become toggles with `defaultSelected` and `onChange`. Their `ref` may now be an anchor. An `IconButton` whose `tooltip` repeats its `label` is named by it and no longer also described by it.
- `ButtonGroup` (new, React Aria `Group`): `density` (`regular`, `compact`, `attached`), `orientation` and `justified`. Hooks: `ui-button-group`, `data-density`, `data-orientation`, `data-justified`.
- `ActionButton`: `pendingDelay` holds back the pending state so fast actions never flash a spinner.
- `SegmentedChoice`: a sliding React Aria selection indicator (`__indicator`), `iconOnly` segments with label tooltips (`data-icon-only`), `selectionMode="multiple"` (`data-selection-mode`), `name` with hidden inputs, and React Aria's `render`.
- `Tabs`: `TabList` `overflow="menu"` collapses tabs that do not fit into a "more" menu while keeping the selected tab, `scrollButtons`, `onRemove` (close mark and Delete key) and `onAdd`; `Tab` `textValue`; the family keeps React Aria's `render`. Hooks: `__bar`, `__scroll-button`, `__overflow`, `__add`, `__remove`, `data-overflow`, `data-edge`.
- `Breadcrumb`: `overflow="menu"` collapses middle crumbs into a menu after the first crumb, and a crumb's `menu` offers the places beside it. Hooks: `__overflow`, `__menu`, `data-overflow`.
- `ToolbarScroller`: tools as `items` with `renderItem`, and `overflow="menu"` that moves tools into a menu by `priority`. Hooks: `__item`, `__overflow`, `data-overflow`.
- `ActionRow`: `toolbar` (one React Aria toolbar), `overflow="menu"`, and a selection bar with `selectedCount` and `onClearSelection`. Hooks: `__overflow`, `__selection`, `__clear`, `__count`, `data-overflow`, `data-selection`, `data-orientation`.
- `ExpandToggle`: the trigger of a React Aria `Disclosure`, paired with its panel, and `isPending` while children load.
- `useOverflowItems`: `getPriority`, `indicatorRef` for an indicator placed anywhere, `itemContainerRef` for items nested in their own list, and a new measurement when a React Aria collection commits its items late.
- Provider strings: `moreItems`, `addTab`, `selectedCount`, `clearSelection` and `placesBeside`.
