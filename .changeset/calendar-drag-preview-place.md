---
'@flamboyantengineer/ui-components': patch
---

`CalendarView` keeps the events in place while one is dragged: the preview is packed with nothing, drawn from its day's inline start on a time grid and over the first lane of bars, so neither the dragged event nor any other moves under the pointer. The events are packed as usual once the change is released, and as they were when it is abandoned or declined.
