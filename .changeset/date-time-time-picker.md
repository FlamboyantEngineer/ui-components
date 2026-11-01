---
'@flamboyantengineer/ui-components': minor
---

`DateTimeField` picks a time without typing: hour, minute, second and AM/PM columns that take a press or the mouse wheel. A time field opens them from a new clock button, and a date and time, or a date-time range, shows them under the calendar, which now stays open after picking a day. The columns follow the granularity, the hour cycle, the bounds and the time zone. New hooks: `ui-date-time-field__time-columns`, `__time-column`, `__time-option` and `__time-range`. New provider strings: `chooseTime`, `timeOfDay`, `startTime`, `endTime`, `hoursColumn`, `minutesColumn`, `secondsColumn` and `dayPeriodColumn`. Picker state contexts and `Time` are now available from the primitives.
