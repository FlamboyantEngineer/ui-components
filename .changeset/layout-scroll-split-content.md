---
'@flamboyantengineer/ui-components': minor
---

Close gaps in the icon, layout, split, scroll, section and content components.

- `Icon`: `size="inherit"` (`data-size="inherit"`), a 1em box that follows the surrounding font (`UIC-ICON-1.5`). `IconLabel` keeps its three sizes.
- `IconLabel`: with `truncate` the label is a `TruncationTooltip` (it also carries `ui-truncation-tooltip`) and shows the whole label while it is cut (`UIC-ICON-LABEL-1.6`).
- Layout: `GridItem` (`ui-grid-item`, `data-span` 1–12 or `full`, `data-offset` 0–11, `as`); `divided` on `Stack` and `Cluster` (`data-divided`, `ui-stack__divider`, `ui-cluster__divider`); `AspectRatio` (`ui-aspect-ratio`, `data-ratio` `1-1`, `4-3`, `3-2`, `16-9`, `21-9`, `3-4`, `2-3`, `9-16`); `ToolbarRow` `orientation` (`data-orientation` now on every role), `ToolbarRowGroup` (React Aria `Group`, `ui-toolbar-row__group`) and `ToolbarRowSeparator` (React Aria `Separator`, `ui-toolbar-row__separator`).
- `SplitView`: two or more `panes` with a separator between each pair, `sizes`, `defaultSizes`, `onSizesChange` and `onSizesChangeEnd` (the two-pane `size` props stay); pixel panes (`unit: 'pixel'`) that keep their size; `collapsible` panes with `collapsedSize`, Enter to collapse and restore, `onCollapse` and `onExpand`; `handleRef` with `collapse`, `expand` and `resize`; `separatorLabel` may be a function of the separator's index. New pane states `data-flexible` and `data-collapsed`; the reference sheet now sizes panes from `data-flexible`. Splits of other than two percent panes persist a list of sizes.
- `ScrollRegion`: `scrollbarVisibility` (`auto`, `always`, `scroll`, `hover`, `data-scrollbar-visibility`) and `scrollbarHideDelay` for overlay tracks, which publish `data-entering` and `data-exiting` through `useEnterExit`; presses on an overlay track page toward the pointer; edge distances in `--ui-scroll-region-overflow-{y,x}-{start,end}` and `data-overflow-{y,x}-{start,end}` in either scrollbar mode; `data-scrolling` and `data-hovering`; `onTopReached`, `onBottomReached` and `stickToBottom`; `useScrollSpy` and `resolveScrollSpy` follow the current section; `DEFAULT_SCROLLBAR_HIDE_DELAY`.
- `SectionHeader`, `Section` and titled `Card`s without `headingLevel` take one level below the enclosing section (`HeadingLevelContext`, `useHeadingLevel`); a `collapsible` `Section` toggles its content through React Aria's `Disclosure` (`isExpanded`, `defaultExpanded`, `onExpandedChange`; hooks `ui-section-header__trigger`, `__chevron`, `ui-section__panel`, `data-collapsible`, `data-expanded`).
- `Shortcut`: key sequences (`['G', 'I']`) in `Shortcut`, `KeyHints` and the formatting functions, drawn chord by chord (`ui-shortcut__chord`) and read with the new string `shortcutSequence`.
- `DescriptionList`: `columns` 3 and 4, row `span` (`data-span`), and `DescriptionRow` `value` with `formatOptions`, formatted for the provider locale (`formatDescriptionValue`).
- `ProseTable`: `caption` (`ui-prose-table__caption`), `footer` rows, `isRowHeader` and `align` (`data-align`) columns, and `stickyHeader` (`data-sticky-header`).

Behaviour changes: nested sections and cards without `headingLevel` now step down from the enclosing section instead of all using level 3, and overlay scrollbar tracks now take pointer presses instead of passing them to the content beneath.
