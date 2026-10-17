# Split View

`SplitView` holds two panes side by side or stacked. With a fixed `ratio` the stylesheet sizes the two tracks; with `panes` a window splitter between them resizes the first pane by pointer and keyboard, following the WAI-ARIA window splitter pattern. `ResizeHandle` is that splitter on its own, for a host that keeps its own sizes in any unit. A split fills its host and gives each pane its own scrolling, so it divides views, not page content.

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

`SplitView` with `panes` (exactly two) shall render its two children in `ui-split-view__pane` elements (`data-pane` `first` and `second`) either side of a `ResizeHandle`, and publish `data-resizable`. Each pane's element has the pane's `id`, or a generated one, and the separator's `aria-controls` names both. The separator is named by `separatorLabel`, or the provider's `resize` string.

Implementation: `src/components/split-view/split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.2 - Size and bounds

The first pane's size shall be a percentage of the split, applied inline as its flex basis and reported as the separator's value. Its bounds combine both panes' `minSize` and `maxSize` (the first pane's bounds directly, the second pane's as their complement), 10 to 90 by default; conflicting bounds collapse to the upper one. The starting size is a stored size, else `defaultSize`, else 50, clamped to the bounds.

Implementation: `src/components/split-view/split-view.tsx`, `labs/reference/split-view.css`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-2.3 - Controlled and uncontrolled size

`size` shall control the first pane's size; without it the split keeps its own, starting from `defaultSize`. `onSizeChange` receives each new size during a drag and on each key step, and `onSizeChangeEnd` the size after a drag ends or a key step.

Implementation: `src/components/split-view/split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`

### UIC-SPLIT-VIEW-2.4 - Persisted size

With `persistKey`, an uncontrolled split shall restore its size from the provider storage ([PROVIDER.md](PROVIDER.md)) under that key and save it when a drag ends and after each key step, never during a drag. A stored value that is not a number falls back to the default size.

Implementation: `src/components/split-view/split-view.tsx`
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

Implementation: `src/components/split-view/resize-handle.tsx`, `src/components/split-view/split-view.tsx`
Verification: `src/components/split-view/split-view.test.tsx`, `e2e/split-view.spec.ts`

### UIC-SPLIT-VIEW-3.4 - Standalone handle

`ResizeHandle` shall work outside `SplitView` in any unit: the caller passes `value`, `minValue`, `maxValue`, `extent` and `getUnitsPerPixel` and receives `onChange`, `onChangeEnd` and `onResizingChange`. `isDisabled` removes it from the tab order, ignores input and publishes `data-disabled` and `aria-disabled`. `resolveResizeKeyboardValue` exposes the keyboard contract.

Implementation: `src/components/split-view/resize-handle.tsx`
Verification: `src/components/split-view/split-view.test.tsx`

### UIC-SPLIT-VIEW-3.5 - Hooks and caller attributes

`SplitView` and `ResizeHandle` shall carry the hooks below, append the caller's `className`, and forward native props, `ref` and caller `data-*` attributes to their root.

Implementation: `src/components/split-view/split-view.tsx`, `src/components/split-view/resize-handle.tsx`
Verification: `src/components/split-view/split-view.test.tsx`

## Hooks

| Hook                       | Kind      | Values                                                                        | Description                                                |
| -------------------------- | --------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `ui-split-view`            | root      |                                                                               | The split's `<div>`.                                       |
| `ui-split-view__pane`      | slot      |                                                                               | A pane of a resizable split.                               |
| `ui-resize-handle`         | root      |                                                                               | The separator.                                             |
| `ui-resize-handle__grip`   | slot      |                                                                               | Decorative grip inside the separator.                      |
| `ui-resize-handle__shield` | slot      |                                                                               | Viewport cover while dragging, a sibling of the separator. |
| `data-orientation`         | attribute | `horizontal`, `vertical`                                                      | Split direction on the split; bar direction on the handle. |
| `data-ratio`               | attribute | `equal`, `main-sidebar`, `main-rail`, `content-main`, `main-content`          | Fixed track sizes.                                         |
| `data-space`               | attribute | `none`, `3xs`, `2xs`, `xs`, `compact`, `sm`, `sm-plus`, `relaxed`, `md`, `lg` | Gap between fixed tracks.                                  |
| `data-pane`                | attribute | `first`, `second`                                                             | Which pane.                                                |
| `data-grow`                | state     | `true`, `auto`, `none`                                                        | Growth inside a flex parent.                               |
| `data-fill`                | state     | `true`                                                                        | Takes the containing block's full block size.              |
| `data-clip`                | state     | `true`                                                                        | Clips overflowing content.                                 |
| `data-resizable`           | state     | `true`                                                                        | The split has a separator.                                 |
| `data-resizing`            | state     | `true`                                                                        | A pointer drag is in progress.                             |
| `data-disabled`            | state     | `true`                                                                        | The handle ignores input.                                  |
