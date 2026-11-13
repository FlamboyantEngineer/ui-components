---
'@flamboyantengineer/ui-components': minor
---

Layout component fixes from the second library review.

- `useOverflowItems` takes `getKey`, so a list rebuilt on each render with the same items keeps its measurement. `OverflowList`, `ToolbarScroller` and `ActionRow` pass their item keys, so hidden items no longer remount on every host render.
- `CalendarView` keeps a drag while the host re-renders with copies of its events. A key press right after an abandoned drag is a click again. A moved or edited event whose start has an offset or `Z` comes back with an offset only (`…-04:00`), which `Date` reads; only a start that names its zone keeps the name.
- `Tabs` select the tab after a removed selected one (else the one before it) and report it through `onSelectionChange`, controlled or not.
- Delete and Backspace with Alt, Control, Meta or Shift no longer remove a tab. The arrow, Home and End handlers of the separator, breadcrumb, overlay scrollbar thumb and disclosure group leave Alt, Control and Meta chords to the browser.
- `normalizeSplitSizes` keeps a collapsible flexible pane that would be pushed below zero open at its smallest size.
- A separator press that never moves, or a key at the limit, reports no change end and writes no storage.
- A right-to-left horizontal overlay thumb counts its value from the right, and Home and End go to the inline start and end.
- `ScrollRegion`'s overview keeps its subscription for equal markers passed inline.
- `Outline` stops following the viewport while `currentKey` is controlled.
- A `Carousel` swipe drops a press released outside the viewport before it became a swipe.
