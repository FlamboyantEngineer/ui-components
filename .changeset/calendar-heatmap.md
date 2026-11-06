---
'@flamboyantengineer/ui-components': minor
---

Add `CalendarHeatmap`: a daily measurement over weeks or months, a week per column, each day a focusable square named by its date and value at a bounded intensity level (`data-level`, `data-outlier`). Values, missing values and absent days are told apart (`data-state`), and a legend names each level's values. Calendar days are never read as instants. New types `CalendarHeatmapDay`, `CalendarHeatmapProps` and `HeatmapWeekday`, and new strings `chartDate`, `heatmapSummary`, `heatmapMissing`, `heatmapLegend`, `heatmapAtMost`, `heatmapAtLeast` and `heatmapRange`.
