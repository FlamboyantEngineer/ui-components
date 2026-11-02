---
'@flamboyantengineer/ui-components': minor
---

CalendarView: events take a context menu (`eventMenu`, `onEventMenuAction`) with a built-in Edit that opens a modal editor for the title, all-day state, start and end. Saving calls the new `onEventChange` with the changed event; `isReadOnly` keeps an event from being edited.
