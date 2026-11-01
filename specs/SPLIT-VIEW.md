# Split View

`SplitView` holds panes side by side or stacked. With a fixed `ratio` the stylesheet sizes two tracks; with `panes` a window splitter between each pair resizes them by pointer and keyboard, following the WAI-ARIA window splitter pattern, with percent or fixed pixel panes and panes that collapse. `ResizeHandle` is that splitter on its own, for a host that keeps its own sizes in any unit. A split fills its host and gives each pane its own scrolling, so it divides views, not page content.

Configure pane bounds, initial sizes and persistence directly on `SplitView`.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-SPLIT-VIEW-1 - Fixed split

### UIC-SPLIT-VIEW-1.1 - Orientation and ratio

`SplitView` without `panes` shall render its children directly in its root and publish `data-orientation` (`horizontal`, the default, side by side; `vertical`, stacked), `data-ratio` and `data-space` (the gap, `none` by default, from the layout spacing scale). Ratios: `equal` (the default) halves; `main-sidebar` a flexible main track and a bounded sidebar; `main-rail` a flexible main track and a fixed-width rail; `content-main` and `main-content` a track sized to its content before or after a flexible one. It renders no separator.

Implementation: `src/components/split-view/split-view.tsx`, `labs/reference/split-view.css`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-1.2 - Containment

A split shall fill and clip by default (`data-fill`, `data-clip`), and take `grow` like the layout primitives ([LAYOUT.md](LAYOUT.md)). `fill={false}` and `clip={false}` turn them off.

Implementation: `src/components/split-view/split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`

## UIC-SPLIT-VIEW-2 - Resizable split

### UIC-SPLIT-VIEW-2.1 - Structure

`SplitView` with `panes` (two or more) shall render each child in a `ui-split-view__pane` element, in pane order, with a `ResizeHandle` between each pair, and publish `data-resizable`. The first two panes publish `data-pane` `first` and `second`. Each pane has a required `id`, its identity and its element's id, and each separator's `aria-controls` names the two panes beside it. A pane inserted, removed or moved around another leaves that pane's content, focus and size as they were: children and committed sizes follow the panes by `id`, a new pane starting at its default size. Separators are named by `separatorLabel` (a text, or a function of the separator's index from 0), or the provider's `resize` string.

Implementation: `src/components/split-view/split-view.tsx`, `src/components/split-view/resizable-split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.2 - Size and bounds

Each percent pane's size shall be a percentage of the space the pixel panes leave (of the whole split without them), applied inline as its flex basis, except the last percent pane, which publishes `data-flexible` and takes the space the others leave, separators included. A separator between percent panes reports the size of the pane before it; its bounds combine both panes' `minSize` and `maxSize` (the pane's own bounds directly, the other pane's as their complement within the pair), 10 to 90 by default, and conflicting bounds collapse to the upper one. Moving it resizes only those two panes. The starting sizes are stored sizes, else `defaultSizes` (or a two-pane `defaultSize` and its complement), else equal shares, fitted to the bounds, the flexible pane's smallest size winning over its neighbours'.

Implementation: `src/components/split-view/split-view.tsx`, `src/components/split-view/split-layout.ts`, `src/components/split-view/resizable-split-view.tsx`, `labs/reference/split-view.css`
Verification: `src/components/split-view/split-view.test.tsx`, `src/components/split-view/split-layout.test.ts`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.3 - Controlled and uncontrolled size

`sizes` shall control every pane's size, and `size` the first of two panes' size; without them the split keeps its own, starting from `defaultSizes` or `defaultSize`. `onSizesChange` receives every pane's new sizes and `onSizeChange` the first pane's new size, during a drag and on each key step; `onSizesChangeEnd` and `onSizeChangeEnd` receive them after a drag ends, a key step, a collapse, an opening or a resize.

Implementation: `src/components/split-view/use-split-sizes.ts`
Verification: `src/components/split-view/split-view.test.tsx`

### UIC-SPLIT-VIEW-2.4 - Persisted size

With `persistKey`, an uncontrolled split shall restore its sizes from the provider storage ([PROVIDER.md](PROVIDER.md)) under that key and save them when a drag ends, after each key step and after a collapse, an opening or a resize, never during a drag. Two percent panes store the first pane's size as a number; other splits store the list of sizes. A stored value that does not fit the panes falls back to the default sizes. A drag belongs to the storage, the key and the panes' units and bounds it began under: when any of them changes during the drag, the drag is abandoned as a disabled handle abandons it (capture, resizing state and shield cleared, no end reported, nothing saved), and the split shows the sizes of its new owner. The size a collapsed pane reopens at is likewise kept per owner.

Implementation: `src/components/split-view/use-split-sizes.ts`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.5 - Pixel panes

A pane with `unit="pixel"` shall keep a fixed size in pixels (its `defaultSizes` entry, else its `minSize`, else 0), applied inline as its flex basis, while the percent panes share what it leaves as the split resizes. A separator beside a pixel pane reports and changes that pane's size in pixels, between its `minSize` (0 by default) and its `maxSize`, at most the pixels the percent panes hold; when the pixel pane is after the separator, moving toward the inline end shrinks it. Its keyboard steps are a share of the split's measured length. A split whose panes are all in pixels has no flexible pane: every pane keeps its own size as its flex basis whatever the split's length, the space they leave stays empty after the last pane, and each separator sizes the pane before it, so the last pane changes size only through `sizes`, `resize`, or collapsing and opening.

Implementation: `src/components/split-view/split-layout.ts`, `src/components/split-view/resizable-split-view.tsx`
Verification: `src/components/split-view/split-layout.test.ts`, `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.6 - Collapsible panes

A `collapsible` pane shall collapse to its `collapsedSize` (0 by default) when a drag takes it below half way between that size and its `minSize`, snapping back to `minSize` above it, and when Enter is pressed on a separator beside it (the sized pane first). Enter on that separator opens it again at the size it had before collapsing, taking the space from the neighbouring percent pane. A collapsible pane lowers its separator's smallest value to the collapsed size, so Home collapses it and End opens it. A collapsed pane publishes `data-collapsed`, and one collapsed to 0 is `inert`, so its hidden content takes no focus and stays out of the accessibility tree. `onCollapse` and `onExpand` receive the index of a pane that collapses or opens again.

Implementation: `src/components/split-view/split-layout.ts`, `src/components/split-view/use-split-sizes.ts`, `src/components/split-view/resizable-split-view.tsx`
Verification: `src/components/split-view/split-layout.test.ts`, `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.7 - Imperative handle

`handleRef` shall receive `collapse(index)`, which collapses a collapsible pane and gives its share to the neighbouring percent pane (the next one, else the previous), `expand(index)`, which opens a collapsed pane at its size before collapsing, else its smallest size, and `resize(sizes)`, which sets every pane's size fitted to the bounds. Each reports through the size callbacks and persists like a key step; a request that changes nothing is ignored.

Implementation: `src/components/split-view/use-split-sizes.ts`, `src/components/split-view/resizable-split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

## UIC-SPLIT-VIEW-3 - Resize handle

### UIC-SPLIT-VIEW-3.1 - Separator semantics

`ResizeHandle` shall render a focusable `role="separator"` whose `aria-orientation` is the bar's own direction (`vertical` between side-by-side panes, `horizontal` between stacked ones, also published in `data-orientation`) and whose `aria-valuenow`, `aria-valuemin` and `aria-valuemax` report its value and bounds, rounded. It holds a decorative `ui-resize-handle__grip`.

Implementation: `src/components/split-view/resize-handle.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-3.2 - Keyboard

The arrow keys along the separator's axis (Left and Right for a vertical bar, Up and Down for a horizontal one) shall move it by 5 % of `extent` (100 by default), Shift+arrows by 1 %, and Home and End shall jump to the smallest and largest value; steps clamp to the bounds. Moving toward the inline end or down grows the pane before the separator, so in a right-to-left locale Left grows it. With `sizedPane="after"` the value sizes the pane after the separator and the directions reverse. Other keys are left to the page.

Implementation: `src/components/split-view/resize-handle.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-3.3 - Pointer resizing

A primary-button press on the separator shall start a drag that keeps the pointer through pointer capture on the separator; moving along the axis changes the value by the travel times the units per pixel that `getUnitsPerPixel` returns when the drag starts (1 by default), and release, cancellation or lost capture end it. While a drag is in progress the separator and its split publish `data-resizing`, and a `ui-resize-handle__shield` covers the viewport (fixed, inline) so the stylesheet can keep the resize cursor everywhere. Keyboard resizing never enters this state.

Implementation: `src/components/split-view/resize-handle.tsx`, `src/components/split-view/resizable-split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-3.4 - Standalone handle

`ResizeHandle` shall work outside `SplitView` in any unit: the caller passes `value`, `minValue`, `maxValue`, `extent` and `getUnitsPerPixel` and receives `onChange`, `onChangeEnd` and `onResizingChange`. `isDisabled` removes it from the tab order, ignores input and publishes `data-disabled` and `aria-disabled`. Becoming disabled during a drag shall release capture, clear the resizing state and shield, and report `onResizingChange(false)` without `onChangeEnd`; re-enabling requires a new press. A change of `resetKey`, `orientation`, `sizedPane` or the writing direction during a drag abandons it the same way without disabling later presses, and so does unmounting the handle. Every abandoned drag calls `onChangeCancel`, so a caller holding a live preview of the drag drops it. `resolveResizeKeyboardValue` exposes the keyboard contract.

Implementation: `src/components/split-view/resize-handle.tsx`
Verification: `src/components/split-view/split-view.test.tsx`

### UIC-SPLIT-VIEW-3.5 - Hooks and caller attributes

`SplitView` and `ResizeHandle` shall carry the hooks below, append the caller's `className`, and forward native props ([UIC-COMPOSITION-2.4](COMPOSITION.md#uic-composition-24---native-props-of-containers): all of them but `dangerouslySetInnerHTML`), `ref` and caller `data-*` attributes to their root. A disabled `ResizeHandle` still passes pointer and key events to the caller's own handlers while ignoring them itself.

Implementation: `src/components/split-view/split-view.tsx`, `src/components/split-view/resizable-split-view.tsx`, `src/components/split-view/resize-handle.tsx`
Verification: `src/components/split-view/split-view.test.tsx`

## Hooks

| Hook                       | Kind      | Values                                                               | Description                                                |
| -------------------------- | --------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `ui-split-view`            | root      |                                                                      | The split's `<div>`.                                       |
| `ui-split-view__pane`      | slot      |                                                                      | A pane of a resizable split.                               |
| `ui-resize-handle`         | root      |                                                                      | The separator.                                             |
| `ui-resize-handle__grip`   | slot      |                                                                      | Decorative grip inside the separator.                      |
| `ui-resize-handle__shield` | slot      |                                                                      | Viewport cover while dragging, a sibling of the separator. |
| `data-orientation`         | attribute | `horizontal`, `vertical`                                             | Split direction on the split; bar direction on the handle. |
| `data-ratio`               | attribute | `equal`, `main-sidebar`, `main-rail`, `content-main`, `main-content` | Fixed track sizes.                                         |
| `data-space`               | attribute | `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`     | Gap between fixed tracks.                                  |
| `data-pane`                | attribute | `first`, `second`                                                    | The first and second pane.                                 |
| `data-grow`                | state     | `true`, `auto`, `none`                                               | Growth inside a flex parent.                               |
| `data-fill`                | state     | `true`                                                               | Takes the containing block's full block size.              |
| `data-clip`                | state     | `true`                                                               | Clips overflowing content.                                 |
| `data-resizable`           | state     | `true`                                                               | The split has a separator.                                 |
| `data-resizing`            | state     | `true`                                                               | A pointer drag is in progress.                             |
| `data-flexible`            | state     | `true`                                                               | The pane that takes the space the others leave.            |
| `data-collapsed`           | state     | `true`                                                               | A collapsible pane is collapsed.                           |
| `data-disabled`            | state     | `true`                                                               | The handle ignores input.                                  |
