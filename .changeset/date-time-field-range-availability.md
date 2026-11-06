---
'@flamboyantengineer/ui-components': minor
---

`DateTimeField` takes `rangeAvailability`: `contiguous` (the default) keeps refusing a range with any unavailable day, and `endpoints` requires only its start and end days to be available, so a range may span a holiday. The rule applies to typed ranges, calendar picks, presets and the field's check alike, and the value stays one `{ start, end }` interval. Exports the `DateTimeFieldRangeAvailability` type.
