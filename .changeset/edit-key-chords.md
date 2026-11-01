---
'@flamboyantengineer/ui-components': patch
---

`Timeline` items and `DashboardGrid` handles edit only on their documented keys: plain arrows, plus Shift with arrows to resize a timeline bar. Arrows with Alt, Control or Meta (and Shift on a dashboard handle), during an input method composition, or already handled by another listener no longer move or resize anything.
