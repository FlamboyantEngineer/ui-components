---
'@flamboyantengineer/ui-components': minor
---

`ActivityFeed` and `CommentThreadReply` render their times through `Attribution`, like `StateTimeline`, `VersionHistory` and `ChangeList`, so a fix to how attributions read reaches every feed and comment. `CommentThreadReply` takes `getNow`, `fallbackAfterDays` and `timeZone`, so its times can be frozen in tests and read against a hydration-stable clock. `Attribution` takes `timeZone`. The `ui-activity-feed__time` and `ui-comment-thread-reply__time` hooks now sit on the `ui-attribution` span around the `<time>`, and a time alone starts capitalized (`Yesterday`).
