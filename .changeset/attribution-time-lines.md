---
'@flamboyantengineer/ui-components': minor
---

NotificationList, ApprovalPanel and ChatList draw their times through `Attribution` and take `fallbackAfterDays`, `getNow` and `timeZone`; NotificationList also groups days in `timeZone`, and ChatList reads its row names with the same options and the provider clock by default. StateTimeline, ChangeList and VersionHistory pass `timeZone` on to their attributions, and `Attribution` takes `showTooltip`. The time slots now carry `ui-attribution`.
