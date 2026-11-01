---
'@flamboyantengineer/ui-components': patch
---

`HoverCardTrigger` and `UserCardTrigger`'s hover cards keep their open state apart from React Aria's tooltips, so a tooltip on a control inside an open card opens on keyboard focus and hover, and the card stays open.
