---
'@flamboyantengineer/ui-components': minor
---

`RelativeDateField` lines up with `DateTimeField`: `valueKind` is now `mode` (and the root publishes `data-mode` instead of `data-value-kind`), `RelativeDateKind` is now `RelativeDateFieldMode`, and a range is a `DateRangeValue`, exported from `date-time-field` (`RelativeDateRange` is removed). A range now submits its ends under `startName` and `endName`, as `DateTimeField` does, instead of one ISO 8601 interval under `name`.
