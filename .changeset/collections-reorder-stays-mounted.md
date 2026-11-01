---
'@flamboyantengineer/ui-components': minor
---

ListView, Table, Tree and Board keep their rows and cards mounted when reordering (or Table grouping, or Board `onMove`) turns on or off, so focus, scroll position, selection and expansion stay. React Aria's drag and drop stays wired and is disabled while not reordering, so `data-allows-dragging` now stays on rows and collections. Each collection publishes a new `data-reordering` state instead: ListView, Tree and the Table root while they reorder, and each Board cell's grid list while the board takes moves. Restyle reordering through `data-reordering` instead of `data-allows-dragging`. The collections also keep the caller's `id` and `aria-describedby`, which React Aria would replace on a collection that takes drops.
