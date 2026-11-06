---
'@flamboyantengineer/ui-components': minor
---

Adds `MultiDateField`, a field for a set of independent calendar dates: an inline calendar whose pressed days join or leave the set, the chosen dates as removable tags (`hideTags` leaves them out), and one form entry per date under `name`. The value is `YYYY-MM-DD` dates, each once and earliest first. It takes `minValue`, `maxValue`, `isDateUnavailable`, `getDateState`, `maxValues` and the Date Time Field's calendar options. Adds the `tooManyDates` string.
