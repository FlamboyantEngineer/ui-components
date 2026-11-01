---
'@flamboyantengineer/ui-components': patch
---

NotificationList keeps Load more while `hasMore`, even when the filter shows none of the loaded notifications, and no longer says the reader is caught up while the unread count says otherwise. NotificationCenter owns the filter, so closing, reopening or changing the presentation keeps the reader's choice.
