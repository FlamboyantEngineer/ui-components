---
'@flamboyantengineer/ui-components': patch
---

RelativeTime renders the same stable absolute text on the server and while hydrating (an instant in UTC with the zone named), so hydration no longer fails when the wording crosses a boundary between server and client or their time zones differ; it reads the live clock once hydrated.
