---
'@flamboyantengineer/ui-components': minor
---

Add `Timeline`, a Gantt-style view of rows over time: day, week, month and quarter zoom levels with two-row scale headers, bars with progress, milestones, finish-to-start dependency connectors with conflict marking, a today marker, collapsible row groups, a pinned scale and row list while the viewport scrolls, pointer and keyboard moves and resizes reported through `onItemChange({ id, start, end })`, item selection, and a table view built on `Table`. Items are buttons described by their dates, progress and predecessors.

Add `floorToTimeUnit` and `addTimeUnits`, calendar-unit helpers beside `createTimeScale`, and the `timeline*` strings (`timeline`, `timelineDates`, `timelineMilestone`, `timelineProgress`, `timelineDependsOn`, `timelineConflict`, `timelineKeyboardHint`, `timelineQuarter` and the table column headings). No breaking changes.
