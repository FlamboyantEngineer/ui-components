---
'@flamboyantengineer/ui-components': minor
---

Add shared composition and layout building blocks:

- `mergeProps`, `mergeRefs`, `renderElement` and the `ElementRender` type for swapping elements with React Aria's `render` contract (`specs/COMPOSITION.md`). Swapped elements keep their hooks (`UIC-HOOKS-1.4`).
- `OverflowList` (`ui-overflow-list`, `__item`, `__overflow`, `data-collapse-from`, `data-overflowing`) and the `useOverflowItems` hook with `resolveOverflowCount`, for rows that collapse items into a "+N" count or a "more" menu. Its root takes `render`.
- `Card` gives a custom header's React Aria `Heading slot="title"` the title's id and hook class, and is named by it.
