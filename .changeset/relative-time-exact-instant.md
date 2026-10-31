---
'@flamboyantengineer/ui-components': patch
---

RelativeTime, Attribution and RelativeDateField keep the exact instant of a timestamp with an offset, `Z` or a zone, so a value in an hour that daylight saving time repeats no longer reads in the wrong direction or with the wrong offset.
