---
'@flamboyantengineer/ui-components': minor
---

Close gaps in the feedback, card, progress and toast components.

- `Badge`: `startIcon` and `endIcon` on label badges, a `variant="dot"` marker (inline or `placement="overlay"`, read as its `aria-label`) and `showZero={false}` to hide a zero count. New hooks: `__start-icon`, `__end-icon` and the `dot` value of `data-variant`.
- `Banner`: `autoFocus` moves focus to a newly shown banner once.
- `EmptyState`: an `icon` illustration and `actions` under the description. New hooks: `__icon`, `__actions`.
- `InlineError`: `tone` (`danger`, `warning`, `success`; the last two are polite statuses) and `isPending` for a check still running. New hooks: `__spinner`, `data-tone`, `data-pending`.
- `Card`: `href` (with `target` and `rel`) or `onAction` make the whole card a link or press target whose title is the action, while inner controls keep their clicks; a custom header's `slot="action"` React Aria `Link` or `Button` takes the action through slot contexts. `media` and `isLoading` (a decorative skeleton). New hooks: `__media`, `__action`, `__skeleton`, `data-loading`.
- `CardGrid` and `CardGridItem`: card collections on React Aria's grid list in its grid layout, with selection checkboxes, actions and collection children (`Virtualizer` with `GridLayout` or `WaterfallLayout`, `GridListLoadMoreItem`). New hooks: `ui-card-grid`, `ui-card-grid-item`, `ui-card-grid-item__checkbox`.
- `LoadMore`: `scrollOffset` loads ahead of the scroll position; `useInView` takes the same `scrollOffset` option.
- `ProgressBar` and `CircularProgress`: `tone` (`data-tone`) and `data-complete` once measured progress reaches the maximum. `Spinner` takes a `label` and then stands alone as an indeterminate progress bar.
- `LoadingOverlay` and `LoadingRegion`: `delay` before showing, `fullscreen` (a portal on the modal layer, `data-fullscreen`), and `data-entering`/`data-exiting`; the region keeps the overlay mounted through its exit with `useEnterExit`.
- Toasts: `queue.update` changes a toast in place without moving it or restarting its timer, `queue.promise` turns a pending toast into a success or error toast, and `isPending` content draws a busy indicator with no timeout. Toasts play their enter and exit (`data-entering`, `data-exiting`; a close now removes a shown toast and calls `onClose` once its exit ends), swipe away (`swipeDirection`, `swipeThreshold`, `data-swiping`, `data-swipe-direction`, `--ui-toast-swipe-x`, `--ui-toast-swipe-y`) and publish their stack position (`--ui-toast-index`, `--ui-toast-offset`); the region publishes `data-expanded`. New hook: `__spinner`.
- `Tooltip`: `relationship="label"` makes string content the trigger's accessible name.
- `TruncationTooltip`: `expandable` draws a show more or less control that reveals cut text in place (`isExpanded`, `defaultExpanded`, `onExpandedChange`). New hooks: `__toggle`, `data-expanded`.
- New strings: `showMore`, `showLess`.
