---
'@flamboyantengineer/ui-components': minor
---

Charts build their table only while the table view shows (`Chart`'s `table` may now be a function), and `BarChart` and `LineChart` keep their scales, layout and drawing while their inputs are unchanged, so a render for the summary, label or legend no longer redraws every value. Their number format is now a shared `Intl.NumberFormat` per locale and options.
