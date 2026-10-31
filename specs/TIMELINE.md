# Timeline

`Timeline` is a Gantt-style view of rows over time, for plans, schedules and roadmaps: each row holds bars (a first and a last day, with optional progress) and milestones (one day), dependencies join items with connectors, and a marker shows today. The time scale zooms between days, weeks, months and quarters; rows can be grouped and collapsed; items move and resize by pointer and keyboard, and the owner applies each change. A table view lists the same items. Positions come from the time scale ([SCALES.md](SCALES.md)) and are set as functional inline styles.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-TIMELINE-1 - Chart

### UIC-TIMELINE-1.1 - Parts

`Timeline` shall render a `ui-timeline` root publishing `data-scale` and `data-view`. In the chart view (the default) the root holds a `ui-timeline__viewport` (the scroll container) around a `ui-timeline__canvas` whose layout tracks are set inline (`grid-template-columns: auto <chart width>px`), holding in order the `ui-timeline__corner`, the `ui-timeline__header` time scale, the `ui-timeline__list` of row names and the `ui-timeline__body` of rows, which is as wide as the scale and `rowHeight` (36 pixels by default) times the visible rows tall. The stylesheet lays the canvas out as a two-column grid and gives the viewport its overflow and size.

Implementation: `src/components/timeline/timeline.tsx`, `src/components/timeline/timeline-chart.tsx`, `labs/reference/timeline.css`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.2 - Range

The chart shall show the days of `range` (`{ start, end }`, both `YYYY-MM-DD` and included). Without a readable range (or one that ends before it starts) it shows the items' first to last day (today when there are no items), widened to whole units of the scale and one more unit on each side. The first and last days shall be found in one pass without sorting the items' dates. The range comes from the items as given, so it does not shift while a drag is in progress.

Implementation: `src/components/timeline/timeline-geometry.ts`, `src/utils/time-scale.ts`
Verification: `src/components/timeline/timeline-geometry.test.ts`, `src/components/timeline/timeline.test.tsx`

### UIC-TIMELINE-1.3 - Time scale and zoom

`scale` shall set the zoom level and the pixels per day: `day` (32), `week` (16, the default), `month` (4) and `quarter` (1.5). The scale maps days with a UTC time scale from the range's first day to the day after its last. The header, pinned to the top of the viewport, holds two `ui-timeline__scale-row` rows, publishing `data-tier` (`major` above, `minor` below) and `data-unit`: months over days or weeks, and years over months or quarters. Each row holds a `ui-timeline__scale-cell` per unit, positioned at the unit's first day (or the range's) and as wide as the unit's days in the range, labelled for the locale: the month and year or the year above; the day of the month, the week's first day (`Mar 2`), the short month or the provider's `timelineQuarter` string (`Q2`) below. The body draws a `ui-timeline__gridline` at the start of each unit of the lower row, with `data-major` where a unit of the upper row also starts.

Implementation: `src/components/timeline/timeline-geometry.ts`, `src/components/timeline/timeline-header.tsx`, `src/components/timeline/timeline-chart.tsx`
Verification: `src/components/timeline/timeline-geometry.test.ts`, `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.4 - Rows and groups

`rows` shall list the rows top to bottom; a row with `children` is a group. Deeply nested groups shall keep their order and depth without relying on recursive calls. The row list, pinned to the start of the viewport, holds a `ui-timeline__row-label` per visible row, `rowHeight` tall, with its depth from 1 as `--ui-timeline-level`, `data-group` on groups and `data-expanded` on expanded groups. Each label holds an [Expand Toggle](EXPAND-TOGGLE.md) in the `ui-timeline__toggle` slot, named by the row and toggling a group (an empty box on other rows, so names align), and the `ui-timeline__row-name`. The body holds a `ui-timeline__row` per visible row, `rowHeight` tall, holding the row's items. Collapsing a group hides its descendant rows and their items and connectors. Numeric and text row or item IDs with the same spelling shall remain distinct when reordered. The expanded groups follow the shared expansion props (`expandedKeys`, `defaultExpandedKeys`, `onExpandedChange`); every group starts expanded by default.

Implementation: `src/components/timeline/timeline-rows.ts`, `src/components/timeline/timeline-chart.tsx`, `src/components/timeline/timeline.tsx`
Verification: `src/components/timeline/timeline-rows.test.ts`, `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.5 - Bars

An item (`{ id, rowId, label, start, end, kind, progress, tone, isReadOnly }`) shall render in its row as a `ui-timeline__item` publishing `data-kind` and `data-tone` (`neutral` by default). A bar (`kind` `bar`, the default) is positioned from the start of its first day to the end of its last (`end`, included; a missing `end` or one before `start` makes a one-day bar) with inline `left` and `width`, and shows its `label` in a `ui-timeline__item-label`. With `progress` (0 to 1, clamped) it holds a `ui-timeline__progress` whose inline width is that share of the bar. An item whose row is not in `rows`, or whose `start` is not a date, is not drawn. The stylesheet centres items vertically in their row.

Implementation: `src/components/timeline/timeline-item.tsx`, `src/components/timeline/timeline-geometry.ts`, `src/components/timeline/timeline-layout.ts`
Verification: `src/components/timeline/timeline.test.tsx`, `src/components/timeline/timeline-geometry.test.ts`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.6 - Milestones

An item with `kind` `milestone` shall mark the middle of its `start` day with an inline `left` and no width, which the stylesheet draws as a diamond centred there with its label beside it; it has no progress.

Implementation: `src/components/timeline/timeline-item.tsx`, `src/components/timeline/timeline-geometry.ts`
Verification: `src/components/timeline/timeline.test.tsx`, `src/components/timeline/timeline-geometry.test.ts`

### UIC-TIMELINE-1.7 - Dependencies

`dependencies` (`{ from, to }`, finish to start) shall be drawn in a `ui-timeline__connectors` SVG layer behind the items, as wide and tall as the body, with one `ui-timeline__connector` path per dependency whose items are both visible: from the end of `from` (a milestone's centre) at the middle of its row, out and along to the start of `to`, ending in an arrow head. Each item's validated dates shall be reused across its placement and all dependency descriptions. When `to` starts less than 16 pixels after `from` ends, the path steps back along the boundary of the target's row. A dependency is in conflict, `data-conflict` on its connector and on the following item, when the following item starts before the day the item it follows ends.
Connector identities shall preserve each endpoint's key type and delimiters.
Implementation: `src/components/timeline/timeline-geometry.ts`, `src/components/timeline/timeline-layout.ts`, `src/components/timeline/timeline-chart.tsx`
Verification: `src/components/timeline/timeline-geometry.test.ts`, `src/components/timeline/timeline-layout.test.ts`, `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.8 - Today marker

When `today` (`YYYY-MM-DD`, the current day in the local time zone by default) falls in the range, the body shall draw a `ui-timeline__today` marker at the middle of that day, spanning the body's height.

Implementation: `src/components/timeline/timeline-chart.tsx`, `src/components/timeline/timeline.tsx`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.9 - Scrolling with a pinned scale and row list

The header and the corner shall stick to the top of the viewport, and the row list and the corner to its start, with inline sticky positions and layering (corner above header above list, body below them), so the scale stays in view while the rows scroll down and the row names stay in view while the chart scrolls sideways.

Implementation: `src/components/timeline/timeline-chart.tsx`, `src/components/timeline/timeline-header.tsx`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-1.10 - Hooks and caller attributes

`Timeline` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref`, `aria-describedby` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/timeline/timeline.tsx`, `src/components/timeline/timeline-hooks.ts`
Verification: `src/components/timeline/timeline.test.tsx`

### UIC-TIMELINE-1.11 - Reading direction

The time axis shall follow the provider locale's reading direction: right to left, time runs from the right edge to the left, with the row list and the corner pinned to the right. Bars, milestones, gridlines, scale cells and the today marker are offset from the axis's start edge (`right` right to left, `left` otherwise), dependency connectors are mirrored onto the flipped axis, and a bar's `start` handle sits at its right edge. The keys and the pointer follow the axis (UIC-TIMELINE-2.1, UIC-TIMELINE-2.2).

Implementation: `src/components/timeline/timeline-chart.tsx`, `src/components/timeline/timeline-header.tsx`, `src/components/timeline/timeline-item.tsx`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

## UIC-TIMELINE-2 - Editing and selection

### UIC-TIMELINE-2.1 - Pointer moves and resizes

With `onItemChange`, a primary-button pointer drag on an item that is not `isReadOnly` shall capture the pointer and move the item by whole days (the pointer's travel divided by the pixels per day, rounded, toward the later end of the axis, which is the left right to left); a drag that starts on a bar's `ui-timeline__handle` (`data-edge` `start` or `end`, drawn only on movable bars) moves that end instead, never past the other. The item shows the days as it goes and publishes `data-dragging`; releasing the pointer calls `onItemChange({ id, start, end })` once when the days changed, and a cancelled drag drops them. Making the item read-only or removing `onItemChange` during a drag shall release capture, clear the draft and dragging state, and report no change. Re-enabling editing requires a new press. An item that leaves the chart during a drag (a switch to the table view, a collapsed group, a removed item) shall likewise discard its draft and report no change, so the chart shows the source dates again and the next pointer or keyboard edit starts from them. The owner applies the change to `items`. A press that travels 3 pixels or more does not select; a drag that is cancelled or loses capture leaves the next keyboard press on the item to select as usual.

Implementation: `src/components/timeline/use-timeline-drag.ts`, `src/components/timeline/timeline-geometry.ts`, `src/components/timeline/timeline-item.tsx`
Verification: `src/components/timeline/timeline.test.tsx`, `src/components/timeline/timeline-geometry.test.ts`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-2.2 - Keyboard moves and resizes

With `onItemChange`, Left and Right Arrow on a focused movable item shall move it one unit of the scale (a day, a week, a month or a quarter) back or forward, mirrored right to left so the arrow points the way the item moves on the axis, keeping a bar's length in days, and Shift with Left and Right Arrow shall move a bar's last day by one unit, never before its first; each key calls `onItemChange` with the new days. Shift with arrows does nothing on a milestone.

Implementation: `src/components/timeline/timeline-item.tsx`, `src/components/timeline/timeline-geometry.ts`, `src/utils/time-scale.ts`
Verification: `src/components/timeline/timeline.test.tsx`, `src/components/timeline/timeline-geometry.test.ts`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-2.3 - Fixed items

Without `onItemChange`, and for an item with `isReadOnly`, the item shall not move or resize by pointer or keyboard, draw no handles and publish `data-readonly`.

Implementation: `src/components/timeline/timeline-item.tsx`, `src/components/timeline/timeline.tsx`
Verification: `src/components/timeline/timeline.test.tsx`

### UIC-TIMELINE-2.4 - Selection

With `selectionMode` `single` or `multiple`, pressing an item (a click, Enter or Space) shall toggle its selection: `single` replaces the selection with the item, or empties it when the item was selected; `multiple` adds or removes the item. Selected items publish `data-selected` and every item has `aria-pressed`. The selection follows the shared selection props (`selectedKeys`, `defaultSelectedKeys`, `onSelectionChange` with a set of item ids; `'all'` selects every item). With `none` (the default) items have no `aria-pressed`.

Implementation: `src/components/timeline/timeline.tsx`, `src/components/timeline/timeline-item.tsx`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

## UIC-TIMELINE-3 - Table view

### UIC-TIMELINE-3.1 - Items as a table

With `view` `table`, the root shall hold a library [Table](TABLE.md) in the `ui-timeline__table` slot instead of the chart, named like the timeline, with one row per drawn item in row order and then by first day, and the columns Item (the row header), Row, Start, End (empty for milestones) and Progress (a percentage), headed by the provider's `timelineItemColumn`, `timelineRowColumn`, `timelineStartColumn`, `timelineEndColumn` and `timelineProgressColumn` strings, with days written for the locale. Item, Row, Start and End sort. The table shares the timeline's selection mode and selection. The table renders every item, as the chart does: a timeline is bounded by the items its chart can draw, a few hundred, so the table view is not virtualized.

Implementation: `src/components/timeline/timeline-table.tsx`, `src/components/timeline/timeline.tsx`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-3.2 - Stable table inputs

The table view shall hand its `Table` the same `columns` while the provider strings and locale are unchanged, and the same `rows` while the timeline's rows and items are unchanged, so a selection change does not rebuild the table's column layout or cell grid.

Implementation: `src/components/timeline/timeline-table.tsx`
Verification: `src/components/timeline/timeline-table-identity.test.tsx`

## UIC-TIMELINE-4 - Accessibility

### UIC-TIMELINE-4.1 - Named group

The root shall be a `group` named by `aria-label` or `aria-labelledby`, or by the provider's `timeline` string without them. Each body row is a `group` labelled by its row name, so an item is announced with its row.

Implementation: `src/components/timeline/timeline.tsx`, `src/components/timeline/timeline-chart.tsx`, `src/core/timeline-strings.ts`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-4.2 - Items are described buttons

Each item shall be a `<button>` in the tab order, named by its `label` and described by a hidden text joining, with `. `, its days (`timelineDates` with the first and last days, or `timelineMilestone` with the day, written as medium dates for the locale), its progress (`timelineProgress` with a percentage), its predecessors' names (`timelineDependsOn`), `timelineConflict` when it is in conflict, and `timelineKeyboardHint` when it moves.

Implementation: `src/components/timeline/timeline-item.tsx`, `src/core/timeline-strings.ts`
Verification: `src/components/timeline/timeline.test.tsx`, `e2e/timeline.spec.ts`

### UIC-TIMELINE-4.3 - Decorative parts

The time scale, gridlines, today marker and connector layer shall be hidden from assistive technology; their meaning reaches it through the item descriptions and the table view.

Implementation: `src/components/timeline/timeline-header.tsx`, `src/components/timeline/timeline-chart.tsx`
Verification: `src/components/timeline/timeline.test.tsx`

## Hooks

| Hook                      | Kind      | Values                                            | Description                                                      |
| ------------------------- | --------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| `ui-timeline`             | root      |                                                   | The root `group`.                                                |
| `ui-timeline__viewport`   | slot      |                                                   | The chart's scroll container.                                    |
| `ui-timeline__canvas`     | slot      |                                                   | The two-column grid of corner, scale, row list and body.         |
| `ui-timeline__corner`     | slot      |                                                   | The pinned cell above the row list.                              |
| `ui-timeline__header`     | slot      |                                                   | The pinned time scale.                                           |
| `ui-timeline__scale-row`  | slot      |                                                   | A row of the time scale.                                         |
| `ui-timeline__scale-cell` | slot      |                                                   | A unit of a scale row, with its label.                           |
| `ui-timeline__list`       | slot      |                                                   | The pinned column of row names.                                  |
| `ui-timeline__row-label`  | slot      |                                                   | A row's toggle and name.                                         |
| `ui-timeline__toggle`     | slot      |                                                   | A row's expand toggle, or the empty box of a row with none.      |
| `ui-timeline__row-name`   | slot      |                                                   | A row's name.                                                    |
| `ui-timeline__body`       | slot      |                                                   | The rows of items, with guides and connectors.                   |
| `ui-timeline__gridline`   | slot      |                                                   | A line at the start of a unit of the scale.                      |
| `ui-timeline__today`      | slot      |                                                   | The today marker, at the middle of the day.                      |
| `ui-timeline__connectors` | slot      |                                                   | The SVG layer of dependency connectors.                          |
| `ui-timeline__connector`  | slot      |                                                   | A dependency's path, with its arrow head.                        |
| `ui-timeline__row`        | slot      |                                                   | A row of items, a labelled `group`.                              |
| `ui-timeline__item`       | slot      |                                                   | A bar or milestone `<button>`.                                   |
| `ui-timeline__progress`   | slot      |                                                   | The completed share of a bar.                                    |
| `ui-timeline__item-label` | slot      |                                                   | An item's visible label.                                         |
| `ui-timeline__handle`     | slot      |                                                   | A resize handle at one end of a movable bar.                     |
| `ui-timeline__table`      | slot      |                                                   | The table of the table view.                                     |
| `data-scale`              | attribute | `day`, `week`, `month`, `quarter`                 | The zoom level, on the root.                                     |
| `data-view`               | attribute | `chart`, `table`                                  | The view, on the root.                                           |
| `data-tier`               | attribute | `major`, `minor`                                  | On a scale row: the larger unit above or the scale's unit below. |
| `data-unit`               | attribute | `day`, `week`, `month`, `quarter`, `year`         | On a scale row: its unit.                                        |
| `data-kind`               | attribute | `bar`, `milestone`                                | On an item.                                                      |
| `data-tone`               | attribute | `neutral`, `info`, `success`, `warning`, `danger` | On an item: its tone.                                            |
| `data-edge`               | attribute | `start`, `end`                                    | On a handle: the end of the bar it moves.                        |
| `data-group`              | state     | `true`                                            | On a row label: the row has children.                            |
| `data-expanded`           | state     | `true`                                            | On a group's row label: the group is expanded.                   |
| `data-major`              | state     | `true`                                            | On a gridline: a unit of the upper scale row starts there.       |
| `data-selected`           | state     | `true`                                            | On a selected item.                                              |
| `data-dragging`           | state     | `true`                                            | On an item while a pointer drags it.                             |
| `data-readonly`           | state     | `true`                                            | On an item that does not move.                                   |
| `data-conflict`           | state     | `true`                                            | On a connector, and an item, that starts before it may.          |
| `--ui-timeline-level`     | property  |                                                   | On a row label: the row's depth, from 1, for indentation.        |
