---
'@flamboyantengineer/ui-components': patch
---

CalendarView decides whether a timed event is a bar by wall-clock days in its time zone, not 24 elapsed hours, so a midnight-to-midnight event stays a bar on a day the clocks change.
