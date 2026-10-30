---
'@flamboyantengineer/ui-components': patch
---

Persisted state is checked before it is restored. `DashboardGrid` refuses a stored layout that is not a list of `{ id, x, y, w, h }` items, `Board` refuses stored collapsed columns or lanes that are not lists of keys, and `Tour` and `PropertySection` ignore stored states that are not booleans. Each falls back to its default instead of failing to render, and the character grid's recent list is refused whole when any entry is not a character.
