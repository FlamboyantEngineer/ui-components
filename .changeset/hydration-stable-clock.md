---
'@flamboyantengineer/ui-components': minor
---

`UiProvider` takes `getNow` and `timeZone`, the one clock and time zone that `RelativeTime`, `Attribution`, `RelativeDateField`, `ActivityFeed`, `NotificationList`, `CalendarView`, `Timeline` and `LineChart` read today from; `useNow`, `useToday` and `useTimeZone` read them for host components. A server render and its hydration never read the clock or the device's zone, so their markup matches: day headings show dates, no today is marked, and a `CalendarView` without a date draws once hydrated. `RelativeDateField` and `RelativeTime` gain a `timeZone` prop.
