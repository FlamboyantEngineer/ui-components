---
'@flamboyantengineer/ui-components': minor
---

`Table` and `Tree` take `handleRef`, a collection handle that reveals (`revealKey`) or focuses (`focusKey`) a row by its own id, drawn or not: a virtualized collection scrolls to the row's place first, and a table can target one cell with `columnId`. Revealing never moves focus, expands, filters, pages or loads; a row the collection does not show resolves `{ found: false, reason }` (`missing`, `filtered`, `collapsed`, `paged` or `unmounted`). New shared types: `CollectionHandle`, `CollectionRevealResult`, `CollectionRevealMiss`, `TableHandle`, `TableRevealOptions` and `TreeHandle`.
