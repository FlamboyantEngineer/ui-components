---
'@flamboyantengineer/ui-components': minor
---

`BarChart` and `LineChart` take `references`, lines and bands at values of the value axis, and `LineChart` also `xReferences` at dates or numbers of its x axis. They draw under the values with `ui-chart__reference*` hooks, never stretch the axis, are cut to the plot, and are listed in the generated summary. New types `ChartReference`, `ChartReferenceLine` and `ChartReferenceBand`, and new strings `chartReferenceLine`, `chartReferenceBand` and `chartSummaryReferences`.
