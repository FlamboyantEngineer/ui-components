---
'@flamboyantengineer/ui-components': patch
---

Table grouping keeps numbers, booleans, text and dates with the same text in separate groups, so `1` and `"1"` no longer share a group, its aggregates or its value. The text keeps the plain group key; the other kinds take suffixes in a fixed order.
