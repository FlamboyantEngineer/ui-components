---
'@flamboyantengineer/ui-components': patch
---

`CalendarView` ghosts the event as it is while either of its edges is dragged, as it already did while the event was moved: every drawn part of the dragged event publishes `data-dragging` from the drag threshold until the drag is released or abandoned.
