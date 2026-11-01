---
'@flamboyantengineer/ui-components': patch
---

`Table` no longer throws on an invalid `Date` cell. When grouping, the invalid date joins the empty values, and copying or filling it gives empty text. Groups now use the same local day as the date filter, and the filter reads years before 1000 as four-digit days, so they compare in order.
