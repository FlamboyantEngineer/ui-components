---
'@flamboyantengineer/ui-components': minor
---

Extend the toolbar row, segmented choice, text field and table.

- `ToolbarRow`: `overflow` (`wrap` by default, `scroll` in a `ToolbarScroller` whose strip is the toolbar, or `none`) and `isPending` (the row keeps its place with inert controls). `ToolbarRowGroup`: `density` (`regular`, `attached`), and groups follow the row's wrapping. New types `ToolbarRowOverflow` and `ToolbarRowGroupDensity`. Hooks: `data-overflow`, `data-pending`, `data-density`, and `data-wrap` on groups.
- **Breaking:** `ToolbarRow` no longer takes `wrap`; use `overflow="wrap"` (the default) or `overflow="none"` for `wrap="nowrap"`. The row still publishes `data-wrap`.
- `SegmentedChoice`: an option's `count` after its label (`__count`, capped at `countMax`, 99 by default) read in the segment's name (`Open, 3`), and an `onChange` that may return a promise: the pick shows at once, stays pending (`data-pending`, `aria-busy`) until it settles and goes back on rejection.
- `TextField`: `transformInput` rewrites or filters typed, pasted and dropped text before it becomes the value and keeps the caret after the same accepted characters; `displayValue` is what the control shows while it does not have focus (`data-display-value`).
- `Table`: `getRowAttributes(row)` puts caller `data-*` attributes on each data row (new type `TableRowAttributes`); hook values win.
- Provider string: `labelWithCount`.
