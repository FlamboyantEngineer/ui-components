---
'@flamboyantengineer/ui-components': minor
---

`Board` takes `dragTrigger`, and `ListView` and `Tree` take `reorder.dragTrigger`: with `'handle'` only a row's or card's drag handle starts a pointer drag, so a press in a field inside it selects text instead of dragging. A `Tree` row with its name field open no longer drags.
