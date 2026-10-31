---
'@flamboyantengineer/ui-components': patch
---

Slot hooks clear a caller's attribute for a `false`, `null` or `undefined` value, as root hooks do, and NotificationCenter, DecisionControl, Menubar and Card publish their open, pending, decision and moved states through the hook data instead of hand-written attributes.
