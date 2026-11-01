---
'@flamboyantengineer/ui-components': patch
---

Write plain spaces in every date, time and range text the shared date formatters produce, so `RelativeTime`, `ChatList` rows, `RelativeDateField`, `VersionHistory` titles, `DescriptionList` dates and `LineChart` time axes render the same text on the server and in the browser that hydrates them, whatever spaces each runtime writes before AM/PM or around a range's dash.
