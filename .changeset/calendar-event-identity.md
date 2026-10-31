---
'@flamboyantengineer/ui-components': patch
---

`CalendarView` keys all-day and multi-day event buttons by event id instead of lane, so repacked lanes no longer hand a focused event's button to another event: focus stays on the same event and Enter or Space reports its own id. A focused event that is removed or hidden behind the more button hands focus to its day cell.
