---
'@flamboyantengineer/ui-components': minor
---

`CalendarView` events change without visible handle bars. A new `eventDragMode` prop picks how: `'move'` (the default) drags the event itself to move it and its end edge to change its end; `'resize'` drags its start or end edge to change that end alone. Edges are invisible buttons (`event-start`, `event-end` slots inside an `event-frame`), a click without dragging still opens the editor, and the arrow keys step the focused event or edge. The `event-move` and `event-resize` slots and the `moveEvent` and `resizeEvent` strings are removed in favour of `changeEventStart` and `changeEventEnd`; `CalendarEventDragMode` is exported.
