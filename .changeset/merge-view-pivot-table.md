---
'@flamboyantengineer/ui-components': minor
---

Add a three-way merge view and a pivot table.

- `MergeView` (new): our side, the base (`showBase`) and their side level with each other over a result pane, all scrolling together; clean changes are merged, and each conflict offers take ours, theirs, both or base actions and an editable result. A header counts the unresolved conflicts (a live status) and moves between them. `base`, `ours`, `theirs`, `oursLabel`, `baseLabel`, `theirsLabel`, `onChange({ text, resolutions, unresolved })`. Hooks: `ui-merge-view` with its slots, `data-show-base`, `data-side`, `data-kind`, `data-change`, `data-resolution`, `data-take`, `data-current`.
- `mergeThreeWay(base, ours, theirs)` (new utility, built on `diffSequences`): chunks that are `unchanged`, changed by `ours`, `theirs` or `both`, or a `conflict`, each with the base's and both sides' lines.
- `PivotTable` (new): rows grouped by row fields in expandable groups, columns by column fields, cells aggregating values (sum, count, minimum, maximum, average or a function), row and column totals and sortable columns, drawn with `Table`; `fieldChooser` adds a board that moves fields between rows, columns and values by drag and drop or Alt+Arrow keys and picks each value's aggregation. `records`, `fields` (`label`, `formatKey`, `formatOptions`, `aggregate`), `layout`/`defaultLayout`/`onLayoutChange`, expansion props. Hooks: `ui-pivot-table` with its slots, `data-zone`, `data-total`.
- `pivot(records, layout)` (new utility): nested row groups, columns, cells and totals computed from the records.
- `Table`: the summary row of a table with nested rows no longer carries an invalid tree position (`aria-posinset`, `aria-setsize`).
- Provider strings: `mergeViewOurs`, `mergeViewBase`, `mergeViewTheirs`, `mergeViewResult`, `mergeViewConflictCount`, `mergeViewConflict`, `mergeViewConflictResult`, `mergeViewUnresolved`, `mergeViewResolved`, `mergeViewTake`, `mergeViewTakeBoth`, `mergeViewPreviousConflict`, `mergeViewNextConflict`, `mergeViewLine`, `pivotFields`, `pivotRows`, `pivotColumns`, `pivotValues`, `pivotTotal`, `pivotEmptyKey`, `pivotNoFields`, `pivotFieldChooser`, `pivotAggregate`, `pivotValueLabel` and `pivotAggregationOf`.
