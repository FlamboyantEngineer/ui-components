---
'@flamboyantengineer/ui-components': minor
---

`DateTimeField` takes `visibleMonths` (1, 2 or 3) to show several calendar months side by side, with one selection and focus across them, and `calendarPaging` (`page` or `month`) for what previous and next move by. With several months each grid carries a `ui-date-time-field__calendar-month` caption. The calendar parts move to `calendar-grid.tsx`, and `CalendarBody` takes an `options` object instead of `months` and `heading`.
