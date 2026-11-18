---
'@flamboyantengineer/ui-components': minor
---

Add `EventTimeline` (`@flamboyantengineer/ui-components/event-timeline`): read-only markers and short intervals on a numeric elapsed-time axis in the caller's unit. Positions and durations are exact shares of the range, so microsecond and sub-microsecond spans keep their proportions; coincident and overlapping events take separate lanes (`eventSpacing` keeps room for labels); `formatValue` and `formatAxisValue` write the values and ticks. Each event is a focusable button with one tab stop and arrow, Home and End keys, the current event (`currentKey`, `defaultCurrentKey`, `onCurrentKeyChange`) shows its details, and `showTable` adds a companion table of the same values. New provider strings: `eventTimelineAt`, `eventTimelineInterval` and `eventTimelineEventColumn`.
