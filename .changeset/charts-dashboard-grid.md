---
'@flamboyantengineer/ui-components': minor
---

Add the chart family and `DashboardGrid`.

- `BarChart` (grouped or stacked, vertical or horizontal), `LineChart` (time or numeric x axis, lines or areas) and `DonutChart`: accessible SVG charts with a named, focusable value per point, a tooltip on hover and keyboard focus, a generated text summary and a table view. Series colours are colour slots (`data-series`, optional `data-tone`).
- `Chart` (the shared accessible frame, also for a host's own drawing), `ChartAxis` and `ChartLegend` (series toggles with `hiddenKeys`).
- `DashboardGrid` and `DashboardTile`: tiles placed by `{ id, x, y, w, h }` data that move and resize by pointer and arrow keys in edit mode, push overlapped tiles down, announce changes, persist through `storageKey`, and reflow onto fewer columns below `minColumnWidth`.
- `createBandScale` utility; React Aria `useMove` in the drag-and-drop primitives.
- Glyphs `table` and `resize`; strings `showAsTable`, `chartLegend`, `chartCategory`, `chartAmount`, `chartShare`, `chartSummary`, `chartValue`, `donutSummary`, `donutSegment`, `moveTile`, `resizeTile`, `tileMoved`, `tileResized`.

No breaking changes.
