---
'@flamboyantengineer/ui-components': patch
---

ChatList, NotificationList, Tree and PdfViewer keep their loading status outside any `aria-busy` element, so assistive technology announces it during the wait. ChatList and an empty pending Tree are no longer busy, NotificationList marks its day groups busy instead of its root, and PdfViewer marks its document busy instead of its root.
