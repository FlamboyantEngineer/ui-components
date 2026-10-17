# Collections

How the library's collection components (menus, list boxes, grids, tables, trees and tag groups built on React Aria collections) render long and incrementally loaded collections. They do not virtualize or page on their own: they take React Aria's `Virtualizer` and its loading sentinels, so the same layouts, keyboard behaviour and accessibility semantics apply everywhere. A component that builds its items from data rather than from children adds `onLoadMore` and `isLoading` props with the sentinel's names and renders the sentinel itself, inside a slot hook of its own. Content that is not a React Aria collection loads more with [Load More](LOAD-MORE.md#uic-load-more-17---loading-on-view).

## UIC-COLLECTIONS-1 - Long collections

### UIC-COLLECTIONS-1.1 - Virtualized rendering

A library component that renders a React Aria collection shall pass its collection children (`Collection` with `items`, sections, sentinels) through to it, so a React Aria `Virtualizer` around the component, with a layout such as `ListLayout`, `GridLayout`, `WaterfallLayout` or `TableLayout`, renders only the items in view, positioned with the layout's functional inline styles, while keyboard navigation reaches every item and each item keeps its hooks, `aria-setsize` and `aria-posinset`. The component needs no prop of its own for it. [Menu](MENU.md) does so.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`

### UIC-COLLECTIONS-1.2 - Loading more inside a collection

A library collection component shall accept React Aria's loading sentinel for its collection (`MenuLoadMoreItem`, `ListBoxLoadMoreItem`, `GridListLoadMoreItem`, `TableLoadMoreItem` or `TreeLoadMoreItem`) after its items, which calls `onLoadMore` when it scrolls into the collection's view while `isLoading` is false, virtualized or not.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`

### UIC-COLLECTIONS-1.3 - Loading more outside a collection

Content that is not a React Aria collection (a plain list, a conversation, a grid of cards) shall load more through `LoadMore` with `autoLoad`, which requests the next page as the control comes into view, measured with `useInView` ([MEASUREMENT.md](MEASUREMENT.md#uic-measurement-41---in-view)).

Implementation: `src/components/load-more/load-more.tsx`, `src/utils/use-in-view.ts`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`
