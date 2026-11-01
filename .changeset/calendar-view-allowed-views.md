---
'@flamboyantengineer/ui-components': patch
---

`CalendarView` shows only a view `views` allows: it opens on the sole allowed view, moves off a view that stops being allowed (without calling `onViewChange`) and returns to it once allowed again; repeated views are ignored and an empty list allows both.
