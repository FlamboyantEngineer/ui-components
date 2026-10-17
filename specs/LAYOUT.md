# Layout

The layout primitives arrange content: `View` and `Page` for a view and its reading column; `Stack`, `Cluster`, `Grid`, `FlexRow` and `InlineField` for content that flows in one or two dimensions; `ToolbarRow` and `StatusBar` for bands of controls; and `Contents`, `InlineContents` and `EmbeddedFrame` for transparent wrappers and embedded frames. They render the element their content needs plus hooks for their options; the stylesheet does all of the layout. `SplitView` ([SPLIT-VIEW.md](SPLIT-VIEW.md)) and `ScrollRegion` ([SCROLL-REGION.md](SCROLL-REGION.md)) complete the family.

## UIC-LAYOUT-1 - Primitives

### UIC-LAYOUT-1.1 - Elements

Each primitive shall render one element with its root class: `View` and `Page` a `<section>`, `Stack`, `Cluster` and `Grid` a `<div>` unless `as` says otherwise, `FlexRow` and `Contents` a `<div>`, `InlineField` a `<label>`, `ToolbarRow` a `<div>`, `StatusBar` a `<footer>`, `InlineContents` a `<span>` and `EmbeddedFrame` an `<iframe>`. Children render in DOM order; no primitive reorders them.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `src/components/layout/wrappers.tsx`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-1.2 - Semantic elements

`Stack`, `Cluster` and `Grid` shall accept `as`, one of `a`, `article`, `aside`, `div`, `dd`, `dl`, `dt`, `fieldset`, `figure`, `footer`, `form`, `header`, `label`, `li`, `main`, `nav`, `ol`, `p`, `section`, `span` and `ul`, together with that element's native props and ref type. They add no role beyond the element's own.

Implementation: `src/components/layout/layout.tsx`
Verification: `src/components/layout/layout.test.tsx`

### UIC-LAYOUT-1.3 - Hooks and caller attributes

Every primitive shall carry the hooks below, append the caller's `className`, and forward native props, `ref` and caller `data-*` attributes to its element. Where a caller attribute has the name of a hook attribute, the primitive's value wins.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `src/components/layout/wrappers.tsx`
Verification: `src/components/layout/layout.test.tsx`

## UIC-LAYOUT-2 - Options

### UIC-LAYOUT-2.1 - Spacing

`space` (the gap between children) and `gutter` (padding) shall take one step of the closed scale `none`, `3xs`, `2xs`, `xs`, `compact`, `sm`, `sm-plus`, `relaxed`, `md`, `lg`, smallest to largest, and publish it in `data-space` and `data-gutter`. Defaults: `md` for `Stack` and `Grid`, `sm` for `Cluster` and `ToolbarRow`, `xs` for `InlineField` and `StatusBar`; `Page`'s gutter is `lg` and `Grid`'s `none`.

Implementation: `src/components/layout/layout.tsx`, `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-2.2 - Alignment and flow

`align` (`start`, `center`, `end`, `stretch`, `baseline`), `justify` (`normal`, `start`, `center`, `end`, `between`) and `wrap` (`wrap`, `nowrap`) shall publish `data-align`, `data-justify` and `data-wrap`. `Stack` aligns `stretch` by default; `Cluster` aligns `center`, justifies `start` and wraps; `InlineField` aligns `center`, justifies `start` and does not wrap; `ToolbarRow` justifies `end` and wraps; `StatusBar` justifies `between` and does not wrap. `inline` on `Cluster` and `InlineField` publishes `data-inline` so the element flows with surrounding text.

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

## UIC-LAYOUT-3 - Wrappers and bands

### UIC-LAYOUT-3.1 - Transparent wrappers

`Contents` and `InlineContents` shall add no box of their own (the stylesheet gives them `display: contents`), for event capture, adapters and portals. `hidden` removes them and their children from layout without unmounting the children.

Implementation: `src/components/layout/wrappers.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/wrappers.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.2 - Embedded frame

`EmbeddedFrame` shall require a `title`, which names the frame, and render fully sandboxed (`sandbox=""`) unless the caller grants permissions through `sandbox`.

Implementation: `src/components/layout/wrappers.tsx`
Verification: `src/components/layout/wrappers.test.tsx`

### UIC-LAYOUT-3.3 - Toolbar row

`ToolbarRow` shall line up controls in a centred row. With `role="toolbar"` (the default) it is a React Aria toolbar: arrow keys move focus between its controls and Tab leaves the row; `role="group"` renders a group whose controls are each a tab stop, and `role="none"` adds no role. `variant` publishes `data-variant`: `plain` (the default) or `band`, a row the stylesheet draws on a surface.

Implementation: `src/components/layout/toolbar-row.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/toolbar-row.test.tsx`, `e2e/layout.spec.ts`

### UIC-LAYOUT-3.4 - Status bar

`StatusBar` shall render a `<footer>` band of status items along the bottom of a view, spaced `xs`, justified `between` and not wrapping by default.

Implementation: `src/components/layout/layout.tsx`, `labs/reference/layout.css`
Verification: `src/components/layout/layout.test.tsx`, `e2e/layout.spec.ts`

## Hooks

| Hook                    | Kind      | Values                                                                        | Description                                                 |
| ----------------------- | --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ui-view`               | root      |                                                                               | `View`'s `<section>`.                                       |
| `ui-page`               | root      |                                                                               | `Page`'s `<section>`.                                       |
| `ui-stack`              | root      |                                                                               | `Stack`'s element.                                          |
| `ui-cluster`            | root      |                                                                               | `Cluster`'s element.                                        |
| `ui-grid`               | root      |                                                                               | `Grid`'s element.                                           |
| `ui-flex-row`           | root      |                                                                               | `FlexRow`'s `<div>`.                                        |
| `ui-inline-field`       | root      |                                                                               | `InlineField`'s `<label>`.                                  |
| `ui-toolbar-row`        | root      |                                                                               | `ToolbarRow`'s `<div>`.                                     |
| `ui-status-bar`         | root      |                                                                               | `StatusBar`'s `<footer>`.                                   |
| `ui-contents`           | root      |                                                                               | `Contents`' `<div>`.                                        |
| `ui-inline-contents`    | root      |                                                                               | `InlineContents`' `<span>`.                                 |
| `ui-embedded-frame`     | root      |                                                                               | `EmbeddedFrame`'s `<iframe>`.                               |
| `data-space`            | attribute | `none`, `3xs`, `2xs`, `xs`, `compact`, `sm`, `sm-plus`, `relaxed`, `md`, `lg` | Gap between children.                                       |
| `data-gutter`           | attribute | `none`, `3xs`, `2xs`, `xs`, `compact`, `sm`, `sm-plus`, `relaxed`, `md`, `lg` | Padding of `Page` and `Grid`.                               |
| `data-align`            | attribute | `start`, `center`, `end`, `stretch`, `baseline`                               | Cross-axis alignment.                                       |
| `data-justify`          | attribute | `normal`, `start`, `center`, `end`, `between`                                 | Main-axis distribution.                                     |
| `data-wrap`             | attribute | `wrap`, `nowrap`                                                              | Whether children wrap.                                      |
| `data-columns`          | attribute | `1`, `2`, `3`, `4`, `6`, `12`, `fit`, `none`                                  | `Grid` column template.                                     |
| `data-min-column-width` | attribute | `sm`, `md`, `lg`, `xl`                                                        | Smallest column of `columns="fit"`.                         |
| `data-width`            | attribute | `full`, `wide`, `reading`, `narrow`                                           | `Page` maximum width.                                       |
| `data-variant`          | attribute | `plain`, `band`                                                               | `ToolbarRow` surface.                                       |
| `data-grow`             | state     | `true`, `auto`, `none`                                                        | Growth inside a flex parent; absent for the default sizing. |
| `data-fill`             | state     | `true`                                                                        | Takes the containing block's full block size.               |
| `data-clip`             | state     | `true`                                                                        | Clips overflowing content.                                  |
| `data-inline`           | state     | `true`                                                                        | Flows inline with surrounding text.                         |
| `data-orientation`      | state     | `horizontal`                                                                  | A `toolbar` row's orientation (React Aria).                 |
