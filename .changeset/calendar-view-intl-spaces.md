---
'@flamboyantengineer/ui-components': patch
---

`CalendarView` writes the spaces of its formatted dates, times and ranges as plain spaces, so a server render hydrates without a text mismatch in browsers that space them differently.
