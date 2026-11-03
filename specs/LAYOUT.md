# Layout

The layout primitives arrange content: `View` and `Page` for a view and its reading column; `Stack`, `Cluster`, `Grid` (with `GridItem` cells), `FlexRow` and `InlineField` for content that flows in one or two dimensions; `ToolbarRow` (with `ToolbarRowGroup` and `ToolbarRowSeparator`) and `StatusBar` for rows of controls; `AspectRatio` for boxes of a fixed proportion; and `Contents`, `InlineContents` and `EmbeddedFrame` for transparent wrappers and embedded frames. They render the element their content needs plus hooks for their options; the stylesheet does all of the layout. `SplitView` ([SPLIT-VIEW.md](SPLIT-VIEW.md)) and `ScrollRegion` ([SCROLL-REGION.md](SCROLL-REGION.md)) complete the family.

## UIC-LAYOUT-1 - Primitives

### UIC-LAYOUT-1.1 - Elements

Each primitive shall render one element with its root class: `View` and `Page` a `<section>`, `Stack`, `Cluster`, `Grid` and `GridItem` a `<div>` unless `as` says otherwise, `FlexRow`, `AspectRatio` and `Contents` a `<div>`, `InlineField` a `<label>`, `ToolbarRow` a `<div>`, `StatusBar` a `<footer>`, `InlineContents` a `<span>` and `EmbeddedFrame` an `<iframe>`. Children render in DOM order; no primitive reorders them.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `src/components/layout/wrappers.tsx`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-1.2 - Semantic elements

`Stack`, `Cluster`, `Grid` and `GridItem` shall accept `as`, one of `a`, `article`, `aside`, `div`, `dd`, `dl`, `dt`, `fieldset`, `figure`, `footer`, `form`, `header`, `label`, `li`, `main`, `nav`, `ol`, `p`, `section`, `span` and `ul`, together with that element's native props and ref type. They add no role beyond the element's own.

Implementation: `src/components/layout/layout.tsx`
Verification: `src/components/layout/layout.test.tsx`

### UIC-LAYOUT-1.3 - Hooks and caller attributes

Every primitive shall carry the hooks below, append the caller's `className`, and forward native props ([UIC-COMPOSITION-2.4](COMPOSITION.md#uic-composition-24---native-props-of-containers): all of them but `dangerouslySetInnerHTML`), `ref` and caller `data-*` attributes to its element. Where a caller attribute has the name of a hook attribute, the primitive's value wins.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `src/components/layout/wrappers.tsx`, `src/components/layout/grid-item.tsx`, `src/components/layout/aspect-ratio.tsx`
Verification: `src/components/layout/layout.test.tsx`, `src/components/layout/grid-item.test.tsx`, `src/components/layout/aspect-ratio.test.tsx`

## UIC-LAYOUT-2 - Options

### UIC-LAYOUT-2.1 - Spacing

`space` (the gap between children) and `gutter` (padding) shall take one step of the closed scale `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, smallest to largest, and publish it in `data-space` and `data-gutter`. Defaults: `2xl` for `Stack` and `Grid`, `md` for `Cluster` and `ToolbarRow`, `xs` for `InlineField` and `StatusBar`; `Page`'s gutter is `3xl` and `Grid`'s `none`.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.2 - Alignment and flow

`align` (`start`, `center`, `end`, `stretch`, `baseline`), `justify` (`normal`, `start`, `center`, `end`, `between`) and `wrap` (`wrap`, `nowrap`) shall publish `data-align`, `data-justify` and `data-wrap`. `Stack` aligns `stretch` by default; `Cluster` aligns `center`, justifies `start` and wraps; `InlineField` aligns `center`, justifies `start` and does not wrap; `ToolbarRow` justifies `end` and publishes in `data-wrap` whether its `overflow` wraps (UIC-LAYOUT-3.8); `StatusBar` justifies `between` and does not wrap. `inline` on `Cluster` and `InlineField` publishes `data-inline` so the element flows with surrounding text.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.3 - Grid columns

`Grid` shall publish `columns` in `data-columns`: `1`, `2` (the default), `3`, `4`, `6` or `12` equal columns; `fit`, as many equal columns of at least `minColumnWidth` (`sm` by default, `md`, `lg`, `xl`, published in `data-min-column-width`) as fit, down to one; or `none`, no template, for a stylesheet or caller class to set the tracks.

Implementation: `src/components/layout/layout.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.4 - Page width

`Page` shall publish its maximum content width in `data-width`: `full`, `wide` (the default), `reading` or `narrow`. The stylesheet centres the column within its host.

Implementation: `src/components/layout/layout.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.5 - Containment

`grow` shall publish growth inside a flex parent in `data-grow`: `true` fills the free space from a zero basis, `auto` grows from the content size, `none` neither grows nor shrinks, and `false` publishes nothing. `fill` (take the containing block's full block size) and `clip` (clip overflowing content) publish `data-fill` and `data-clip`. `View`, `Page`, `FlexRow` and `EmbeddedFrame` grow by default, and `View` and `EmbeddedFrame` also fill and clip by default; the other primitives do none of these unless asked.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `src/components/layout/wrappers.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.6 - Grid items

`GridItem` shall publish the columns it covers in `data-span` (`1` by default to `12`, or `full` for the whole row) and the empty columns before it in `data-offset` (`0` by default to `11`), so the stylesheet places it in its `Grid`'s columns. Cells keep their DOM order: no option reorders them visually, because the reading and focus order must follow what is seen.

Implementation: `src/components/layout/grid-item.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/grid-item.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.7 - Dividers

`divided` on `Stack` and `Cluster` shall publish `data-divided` and render a decorative divider between each pair of rendered children, hidden from assistive technology, in the `ui-stack__divider` or `ui-cluster__divider` slot. The divider is a valid child of the element: an `<li>` in `ul` and `ol`, a `<span>` in `a`, `label`, `p` and `span`, a `<div>` elsewhere. Children that are `null`, `undefined`, booleans or empty strings get no divider; a component child gets one even when it renders nothing, since components are not rendered to find out. Keyed children keep their identity, also when reordered, and turning `divided` on or off keeps every child mounted with its state and focus.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/dividers.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `src/components/layout/layout-identity.test.tsx`, `e2e/layout.spec.ts`

## UIC-LAYOUT-3 - Wrappers and rows

### UIC-LAYOUT-3.1 - Transparent wrappers

`Contents` and `InlineContents` shall add no box of their own (the stylesheet gives them `display: contents`), for event capture, adapters and portals. `hidden` removes them and their children from layout without unmounting the children.

Implementation: `src/components/layout/wrappers.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/wrappers.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.2 - Embedded frame

`EmbeddedFrame` shall require a `title`, which names the frame, and render fully sandboxed (`sandbox=""`) unless the caller grants permissions through `sandbox`.

Implementation: `src/components/layout/wrappers.tsx`
Verification: `src/components/layout/wrappers.test.tsx`

### UIC-LAYOUT-3.3 - Toolbar row

`ToolbarRow` shall line up controls in a centred row. Its root `<div>` carries the row's hooks and holds one strip (`ui-toolbar-row__strip`) that holds the controls in every mode and carries the row's role and name; the stylesheet lays the controls out in the strip. With `role="toolbar"` (the default) the strip is a toolbar: arrow keys move focus between its controls and Tab leaves the row; inside a text control in the row (a text input, a slider or select, a text area, editable content, or an element with role `textbox` or `combobox`) the arrow keys move the caret and move focus only from the end of the text they point to, with no modifier held (Shift, Alt, Control or Meta arrows stay with the control) and no input method composing; a field among several in a group, such as the cells of a `PinInput`, moves between them first. `role="group"` renders a group whose controls are each a tab stop, and `role="none"` adds no role. `variant` publishes `data-variant`: `plain` (the default) or `surface`, a row the stylesheet draws on a surface. `ref` reaches the root `<div>` ([UIC-COMPOSITION-2.5](COMPOSITION.md#uic-composition-25---root-refs)) and `stripRef` the strip, whose element children are the controls.

A caller's `aria-busy` shall reach the root as `true` or `false` in every role, server-rendered markup included. Busy state alone makes nothing inert: the controls and any status inside stay usable, and changing it keeps the row's element, focus and keyboard navigation.

Implementation: `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`, `src/utils/toolbar-caret-keys.tsx`
Verification: `src/components/layout/toolbar-row.test.tsx`, `src/components/layout/toolbar-row-busy.test.tsx`, `e2e/layout.spec.ts`, `src/utils/toolbar-caret-keys.test.tsx`

### UIC-LAYOUT-3.4 - Status bar

`StatusBar` shall render a `<footer>` strip of status items along the bottom of a view, spaced `xs`, justified `between` and not wrapping by default. It is never the page's `contentinfo` landmark: it carries `role="none"`, or `role="group"` when the caller names it with `aria-label` or `aria-labelledby`, and a caller `role` wins.

Implementation: `src/components/layout/layout.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.5 - Aspect ratio

`AspectRatio` shall publish its width-to-height proportion in `data-ratio`: `1-1` (the default), `4-3`, `3-2`, `16-9` or `21-9` landscape, `3-4`, `2-3` or `9-16` portrait. The stylesheet derives the box's height from its width and fits its content, such as an image or an `EmbeddedFrame`, to the box.

Implementation: `src/components/layout/aspect-ratio.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/aspect-ratio.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.6 - Vertical toolbar rows

`ToolbarRow`'s `orientation` (`horizontal` by default, or `vertical`) shall be published in `data-orientation` whatever the role, so the stylesheet stacks a vertical row's controls. A vertical `toolbar` row moves focus with the Up and Down arrows (React Aria), and reports `aria-orientation="vertical"`.

Implementation: `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/toolbar-row.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.7 - Toolbar groups and separators

`ToolbarRowGroup` shall render a group (`role="group"`, named by the caller's `aria-label` or `aria-labelledby`) in the `ui-toolbar-row__group` slot, laid out along its row (`data-orientation` is the row's). `ToolbarRowSeparator` shall render a [Separator](SEPARATOR.md) in the `ui-toolbar-row__separator` slot across the row: vertical (`role="separator"`, `aria-orientation="vertical"`) in a horizontal row and a horizontal `<hr>` in a vertical one, published in `data-orientation`. Separators take no focus, and a toolbar's arrow keys move through the controls of every group.

Implementation: `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/toolbar-row.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.8 - Toolbar overflow

`ToolbarRow`'s `overflow` shall choose what happens to controls that do not fit on one horizontal row, published in `data-overflow`. `wrap` (the default) flows them onto more rows, and every `ToolbarRowGroup` with them: the row and its groups publish `data-wrap="wrap"`. `scroll` keeps them on one row: the strip scrolls, and the root adds a decorative fade (`ui-toolbar-row__fade`, hidden from assistive technology) and a scroll button (`ui-toolbar-row__scroll-button`, out of the tab order) at each edge, both with `data-edge`, shown with `data-overflow-start` or `data-overflow-end` on the root only while that edge hides controls, as in a [Toolbar Scroller](TOOLBAR-SCROLLER.md); a focused control scrolls clear of them. `none` keeps one row and leaves overflow to the caller (for example an [Overflow List](OVERFLOW-LIST.md)). Rows that do not wrap and their groups publish `data-wrap="nowrap"`. A vertical row is one column: it treats `scroll` as `none`. The controls stay mounted, with their state and focus, whichever mode or orientation the row moves to.

Implementation: `src/components/layout/toolbar-row.tsx`, `src/components/toolbar-scroller/use-toolbar-scroll.ts`, `labs/reference/layout.css`
Verification: `src/components/layout/toolbar-row.test.tsx`, `src/components/layout/layout-identity.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.9 - Pending toolbar

While `isPending` is set, `ToolbarRow` shall keep its place and size in the layout but make its controls inert (`inert`: none takes focus or a press, and assistive technology skips them) and publish `data-pending`, so the stylesheet can withhold its paint while the surface it serves starts, and the content below never moves when the controls appear.

Implementation: `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/toolbar-row.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.10 - Attached toolbar groups

A `ToolbarRowGroup` spaces its controls with the row's gap. Its `attached` shall publish `data-attached` and join them into one segmented run, which the reference sheet draws without gaps, with one shared border between neighbours and rounded corners only at the run's ends, as an attached [Button Group](BUTTON-GROUP.md). The controls stay separate tools of the toolbar.

Implementation: `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/toolbar-row.test.tsx`, `e2e/layout.spec.ts`

## Hooks

| Hook                            | Kind      | Values                                                                | Description                                                 |
| ------------------------------- | --------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ui-view`                       | root      |                                                                       | `View`'s `<section>`.                                       |
| `ui-page`                       | root      |                                                                       | `Page`'s `<section>`.                                       |
| `ui-stack`                      | root      |                                                                       | `Stack`'s element.                                          |
| `ui-cluster`                    | root      |                                                                       | `Cluster`'s element.                                        |
| `ui-grid`                       | root      |                                                                       | `Grid`'s element.                                           |
| `ui-grid-item`                  | root      |                                                                       | `GridItem`'s element.                                       |
| `ui-aspect-ratio`               | root      |                                                                       | `AspectRatio`'s `<div>`.                                    |
| `ui-stack__divider`             | slot      |                                                                       | A divider between a divided stack's children.               |
| `ui-cluster__divider`           | slot      |                                                                       | A divider between a divided cluster's children.             |
| `ui-toolbar-row__strip`         | slot      |                                                                       | The element holding a toolbar row's controls in every mode. |
| `ui-toolbar-row__fade`          | slot      |                                                                       | A decorative fade at an edge of a scrolling row.            |
| `ui-toolbar-row__scroll-button` | slot      |                                                                       | A scroll button at an edge of a scrolling row.              |
| `ui-toolbar-row__group`         | slot      |                                                                       | `ToolbarRowGroup`'s `role="group"` element.                 |
| `ui-toolbar-row__separator`     | slot      |                                                                       | `ToolbarRowSeparator`'s separator.                          |
| `ui-flex-row`                   | root      |                                                                       | `FlexRow`'s `<div>`.                                        |
| `ui-inline-field`               | root      |                                                                       | `InlineField`'s `<label>`.                                  |
| `ui-toolbar-row`                | root      |                                                                       | `ToolbarRow`'s `<div>`.                                     |
| `ui-status-bar`                 | root      |                                                                       | `StatusBar`'s `<footer>`.                                   |
| `ui-contents`                   | root      |                                                                       | `Contents`' `<div>`.                                        |
| `ui-inline-contents`            | root      |                                                                       | `InlineContents`' `<span>`.                                 |
| `ui-embedded-frame`             | root      |                                                                       | `EmbeddedFrame`'s `<iframe>`.                               |
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
