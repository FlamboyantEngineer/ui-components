---
'@flamboyantengineer/ui-components': patch
---

Filter conditions: `createFilterCondition` and `changeFilterOperator` give each condition its own empty range or list instead of a shared object. Text matching keeps the operand's leading and trailing spaces, so an equality condition matches its own value. A `Date` record value in years 1 to 999 now reads as a four-digit `YYYY-MM-DD` day, and a `Date` outside years 1 to 9999 has no day.
