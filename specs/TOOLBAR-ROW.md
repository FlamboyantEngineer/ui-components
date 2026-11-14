# Toolbar Row

Generic groups of tools with keyboard navigation, wrapping, scrolling, edge fades and pending presentation.

## UIC-TOOLBAR-ROW-1 - Behavior

### UIC-TOOLBAR-ROW-1.1 - Toolbar row

`ToolbarRow` shall line up controls in a centred row. Its root `<div>` carries the row's hooks and holds one strip (`ui-toolbar-row__strip`) that holds the controls in every mode and carries the row's role and name; the stylesheet lays the controls out in the strip. With `role="toolbar"` (the default) the strip is a toolbar: arrow keys move focus between its controls and Tab leaves the row; inside a text control in the row (a text input, a slider or select, a text area, editable content, or an element with role `textbox` or `combobox`) the arrow keys move the caret and move focus only from the end of the text they point to, with no modifier held (Shift, Alt, Control or Meta arrows stay with the control) and no input method composing; a field among several in a group, such as the cells of a `PinInput`, moves between them first. `role="group"` renders a group whose controls are each a tab stop, and `role="none"` adds no role. `variant` publishes `data-variant`: `plain` (the default) or `surface`, a row the stylesheet draws on a surface. `ref` reaches the root `<div>` ([UIC-COMPOSITION-2.5](COMPOSITION.md#uic-composition-25---root-refs)) and `stripRef` the strip, whose element children are the controls.

A caller's `aria-busy` shall reach the root as `true` or `false` in every role, server-rendered markup included. Busy state alone makes nothing inert: the controls and any status inside stay usable, and changing it keeps the row's element, focus and keyboard navigation.

Implementation: `src/components/toolbar-row/toolbar-row.tsx`, `labs/reference/layout.css`, `labs/reference/toolbar-row.css`, `src/utils/toolbar-caret-keys.tsx`
Verification: `src/components/toolbar-row/toolbar-row.test.tsx`, `src/components/toolbar-row/toolbar-row-busy.test.tsx`, `e2e/toolbar-row.spec.ts`, `src/utils/toolbar-caret-keys.test.tsx`

### UIC-TOOLBAR-ROW-1.2 - Vertical toolbar rows

`ToolbarRow`'s `orientation` (`horizontal` by default, or `vertical`) shall be published in `data-orientation` whatever the role, so the stylesheet stacks a vertical row's controls. A vertical `toolbar` row moves focus with the Up and Down arrows (React Aria), and reports `aria-orientation="vertical"`.

Implementation: `src/components/toolbar-row/toolbar-row.tsx`, `labs/reference/layout.css`, `labs/reference/toolbar-row.css`
Verification: `src/components/toolbar-row/toolbar-row.test.tsx`, `e2e/toolbar-row.spec.ts`

### UIC-TOOLBAR-ROW-1.3 - Toolbar groups and separators

`ToolbarRowGroup` shall render a group (`role="group"`, named by the caller's `aria-label` or `aria-labelledby`) in the `ui-toolbar-row__group` slot, laid out along its row (`data-orientation` is the row's). `ToolbarRowSeparator` shall render a [Separator](SEPARATOR.md) in the `ui-toolbar-row__separator` slot across the row: vertical (`role="separator"`, `aria-orientation="vertical"`) in a horizontal row and a horizontal `<hr>` in a vertical one, published in `data-orientation`. Separators take no focus, and a toolbar's arrow keys move through the controls of every group.

Implementation: `src/components/toolbar-row/toolbar-row.tsx`, `labs/reference/layout.css`, `labs/reference/toolbar-row.css`
Verification: `src/components/toolbar-row/toolbar-row.test.tsx`, `e2e/toolbar-row.spec.ts`

### UIC-TOOLBAR-ROW-1.4 - Toolbar overflow

`ToolbarRow`'s `overflow` shall choose what happens to controls that do not fit on one horizontal row, published in `data-overflow`. `wrap` (the default) flows them onto more rows, and every `ToolbarRowGroup` with them: the row and its groups publish `data-wrap="wrap"`. `scroll` keeps them on one row: the strip scrolls, and the root adds a scroll button (`ui-toolbar-row__scroll-button`, out of the tab order) at each edge and, unless `showEdgeFades` is `false`, a decorative fade (`ui-toolbar-row__fade`, hidden from assistive technology), both with `data-edge`, shown with `data-overflow-start` or `data-overflow-end` on the root only while that edge hides controls, with generic edge controls; a focused control scrolls clear of them. With `showScrollButtons={false}` the paging buttons are omitted; scrolling, edge fades and keyboard focus reveal remain available. The option defaults to true and is independent of showEdgeFades. `none` keeps one row and leaves overflow to the caller (for example an [Overflow List](OVERFLOW-LIST.md)). Rows that do not wrap and their groups publish `data-wrap="nowrap"`. A vertical row is one column: it treats `scroll` as `none`. The controls stay mounted, with their state and focus, whichever mode or orientation the row moves to.

Implementation: `src/components/toolbar-row/toolbar-row.tsx`, `src/components/toolbar-row/use-toolbar-scroll.ts`, `labs/reference/layout.css`, `labs/reference/toolbar-row.css`
Verification: `src/components/toolbar-row/toolbar-row.test.tsx`, `src/components/layout/layout-identity.test.tsx`, `e2e/toolbar-row.spec.ts`

### UIC-TOOLBAR-ROW-1.5 - Pending toolbar

While `isPending` is set, `ToolbarRow` shall keep its place and size in the layout but make its controls inert (`inert`: none takes focus or a press, and assistive technology skips them) and publish `data-pending`, so the stylesheet can withhold its paint while the surface it serves starts, and the content below never moves when the controls appear.

Implementation: `src/components/toolbar-row/toolbar-row.tsx`, `labs/reference/layout.css`, `labs/reference/toolbar-row.css`
Verification: `src/components/toolbar-row/toolbar-row.test.tsx`, `e2e/toolbar-row.spec.ts`

### UIC-TOOLBAR-ROW-1.6 - Attached toolbar groups

A `ToolbarRowGroup` spaces its controls with the row's gap. Its `attached` shall publish `data-attached` and join them into one segmented run, which the reference sheet draws without gaps, with one shared border between neighbours and rounded corners only at the run's ends, as an attached [Button Group](BUTTON.md). The controls stay separate tools of the toolbar.

Implementation: `src/components/toolbar-row/toolbar-row.tsx`, `labs/reference/layout.css`, `labs/reference/toolbar-row.css`
Verification: `src/components/toolbar-row/toolbar-row.test.tsx`, `e2e/toolbar-row.spec.ts`

## Hooks

| Hook                            | Kind      | Values                                                                | Description                                                 |
| ------------------------------- | --------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ui-toolbar-row__strip`         | slot      |                                                                       | The element holding a toolbar row's controls in every mode. |
| `ui-toolbar-row__fade`          | slot      |                                                                       | A decorative fade at an edge of a scrolling row.            |
| `ui-toolbar-row__scroll-button` | slot      |                                                                       | A scroll button at an edge of a scrolling row.              |
| `ui-toolbar-row__group`         | slot      |                                                                       | `ToolbarRowGroup`'s `role="group"` element.                 |
| `ui-toolbar-row__separator`     | slot      |                                                                       | `ToolbarRowSeparator`'s separator.                          |
| `ui-toolbar-row`                | root      |                                                                       | `ToolbarRow`'s `<div>`.                                     |
| `data-space`                    | attribute | `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`      | Gap between children.                                       |
| `data-gutter`                   | attribute | `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`      | Padding of `Page` and `Grid`.                               |
| `data-align`                    | attribute | `start`, `center`, `end`, `stretch`, `baseline`                       | Cross-axis alignment.                                       |
| `data-justify`                  | attribute | `normal`, `start`, `center`, `end`, `between`                         | Main-axis distribution.                                     |
| `data-wrap`                     | attribute | `wrap`, `nowrap`                                                      | Whether children wrap; also on toolbar groups.              |
| `data-columns`                  | attribute | `1`, `2`, `3`, `4`, `6`, `12`, `fit`, `none`                          | `Grid` column template.                                     |
| `data-min-column-width`         | attribute | `sm`, `md`, `lg`, `xl`                                                | Smallest column of `columns="fit"`.                         |
| `data-width`                    | attribute | `full`, `wide`, `reading`, `narrow`                                   | `Page` maximum width.                                       |
| `data-span`                     | attribute | `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `full` | `GridItem` columns covered.                                 |
| `data-offset`                   | attribute | `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`          | `GridItem` empty columns before it.                         |
| `data-ratio`                    | attribute | `1-1`, `4-3`, `3-2`, `16-9`, `21-9`, `3-4`, `2-3`, `9-16`             | `AspectRatio` width to height.                              |
| `data-variant`                  | attribute | `plain`, `surface`                                                    | `ToolbarRow` surface.                                       |
| `data-overflow`                 | attribute | `wrap`, `scroll`, `none`                                              | What a toolbar row does with controls that do not fit.      |
| `data-edge`                     | attribute | `start`, `end`                                                        | The edge a scrolling row's fade or scroll button sits at.   |
| `data-overflow-start`           | state     | `true`                                                                | A scrolling row hides controls past its start.              |
| `data-overflow-end`             | state     | `true`                                                                | A scrolling row hides controls past its end.                |
| `data-attached`                 | state     | `true`                                                                | A toolbar group whose controls are joined.                  |
| `data-pending`                  | state     | `true`                                                                | A toolbar row whose controls are inert while it starts.     |
| `data-grow`                     | state     | `true`, `auto`, `none`                                                | Growth inside a flex parent; absent for the default sizing. |
| `data-fill`                     | state     | `true`                                                                | Takes the containing block's full block size.               |
| `data-clip`                     | state     | `true`                                                                | Clips overflowing content.                                  |
| `data-inline`                   | state     | `true`                                                                | Flows inline with surrounding text.                         |
| `data-divided`                  | state     | `true`                                                                | A stack or cluster draws dividers between its children.     |
| `data-orientation`              | attribute | `horizontal`, `vertical`                                              | A toolbar row's direction, its groups' and its separators'. |
| `data-focus-within`             | state     | `true`                                                                | A toolbar group holds focus (React Aria).                   |
| `data-focus-visible`            | state     | `true`                                                                | A toolbar group holds keyboard focus (React Aria).          |
| `data-hovered`                  | state     | `true`                                                                | The pointer is over a toolbar group (React Aria).           |
