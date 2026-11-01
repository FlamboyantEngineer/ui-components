---
'@flamboyantengineer/ui-components': patch
---

CalendarView and Timeline support the days from 0002-01-01 to 9998-12-31. CalendarView shows a day outside that range at its nearer end and stops navigation there, so the last week no longer repeats a day; Timeline leaves out ranges and items outside it, draws the last day a full day wide and stops moves and resizes at its ends.
