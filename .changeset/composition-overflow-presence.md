---
'@flamboyantengineer/ui-components': minor
---

Add shared composition, layout and animation building blocks:

- `mergeProps`, `mergeRefs`, `renderElement` and the `ElementRender` type for swapping elements with React Aria's `render` contract (`specs/COMPOSITION.md`). Swapped elements keep their hooks (`UIC-HOOKS-1.4`).
- `OverflowList` (`ui-overflow-list`, `__item`, `__overflow`, `data-collapse-from`, `data-overflowing`) and the `useOverflowItems` hook with `resolveOverflowCount`, for rows that collapse items into a "+N" count or a "more" menu. Its root takes `render`.
- `Card` gives a custom header's React Aria `Heading slot="title"` the title's id and hook class, and is named by it.
- `useEnterExit` keeps an element mounted through its exit and times `data-entering` and `data-exiting` from its CSS animations (`specs/ENTER-EXIT.md`). `Banner` gains `isEntering` (`data-entering`) and forwards `ref`.
- `useInView` reports whether an element is visible (`UIC-MEASUREMENT-4`). `LoadMore` gains `autoLoad`, which requests the next page each time the control comes into view (`UIC-LOAD-MORE-1.7`); the reference sheet sets `overflow-anchor: none` on it.
- `specs/COLLECTIONS.md` documents how collection components take React Aria's `Virtualizer` and loading sentinels; `Menu` is verified with both.
- `Portal` gains `inPlace`, which keeps the wrapper where the portal is declared with its layer (also on the server), and `preserveTabOrder`, which moves Tab into and out of the content as if it sat there.
- `TextMatch`: `ignoreAccents` on `TextMatchProvider` and in the matching helpers' options folds accents (`cafe` matches `café`); each mark publishes `data-term`, the index of the term it matched, and `findTermRanges` ranges carry `term`. A range now extends over a trailing combining mark.
