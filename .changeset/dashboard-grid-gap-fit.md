---
'@flamboyantengineer/ui-components': patch
---

DashboardGrid counts its column gap when it decides how many columns of `minColumnWidth` fit, so a grid whose tracks would fall below that width reflows instead of staying editable.
