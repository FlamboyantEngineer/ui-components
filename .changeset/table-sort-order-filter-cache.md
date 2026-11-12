---
'@flamboyantengineer/ui-components': patch
---

`Table` sorts in one consistent order whatever the input order: empty values (absent, null, empty text, `NaN` and invalid dates) first, then text, then numbers, booleans and dates by value. Groups follow the same order. The text filter folds the query once and keeps each row's folded text between keystrokes, and plain ASCII text folds without per-character work.
