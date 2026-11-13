---
'@flamboyantengineer/ui-components': minor
---

Add `onLoadMoreError` to `ChatList`, `NotificationList` (and `NotificationCenter`) and `ActivityFeed`: it receives a failed `onLoadMore`, which had nowhere to go and surfaced as an unhandled rejection. `ChatList` also stops filtering by the search text once `showSearch` is off, and filters only when the conversations or the text change.
