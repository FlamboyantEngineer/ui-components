---
'@flamboyantengineer/ui-components': patch
---

ActivityFeed and NotificationList read the day of an instant in the provider's (or given) time zone, the same zone that decides today, so a server and a browser in other zones head the same groups.
