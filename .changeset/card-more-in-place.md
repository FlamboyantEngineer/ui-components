---
'@flamboyantengineer/ui-components': minor
---

`Card`'s More button is now a disclosure that reveals moved regions where they stand, instead of a popover holding copies. Header regions, the summary and a custom header keep their element and their state across presentations and every time More opens or closes. A minimal custom header with an `abbreviation` is revealed by More, its actions and `CardAction` included. Moved regions carry `data-moved`, and the `ui-card__more-panel` slot is removed.
