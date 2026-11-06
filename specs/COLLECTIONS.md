# Collections

The contract every library collection component (menus, list boxes, list views, card grids, tables, trees and tag groups) follows for long and incrementally loaded collections. Callers describe the collection with the component's own items (library children such as `MenuItem`, or data entries) and turn on virtualized rendering and incremental loading with props; the component renders the building block's virtualizer, layout and loading sentinel itself. A caller never imports or assembles a building block's collection parts (`Collection`, `Virtualizer`, layouts, loading sentinels), so the building block behind a component can change without touching its callers. Content that is not a collection loads more with [Load More](LOAD-MORE.md#uic-load-more-17---loading-on-view).

## UIC-COLLECTIONS-1 - Long collections

### UIC-COLLECTIONS-1.1 - Virtualized rendering

A library collection component that offers virtualized rendering shall take a `virtualized` boolean prop and, while it is set, render through the building block's virtualizer with the component's layout: only the items in view of its scroll container (plus a small buffer) are in the document, positioned with the layout's functional inline styles, while keyboard navigation reaches every item and each item keeps its hooks, `aria-setsize` and `aria-posinset`. It publishes `data-virtualized` on its root. Filtering, sections and loading more work the same virtualized or not. [Menu](MENU.md#uic-menu-53---virtualized-menu) does so.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`

### UIC-COLLECTIONS-1.2 - Loading more inside a collection

A library collection component that loads incrementally shall take `onLoadMore` and `isLoading` props and render the building block's loading sentinel after its items itself, in a slot hook of its own: the sentinel calls `onLoadMore` when it scrolls into the collection's view while `isLoading` is false, virtualized or not, and while `isLoading` draws a loading row reading the provider's `loading` string, alone in place of the empty state while there are no items.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`

### UIC-COLLECTIONS-1.3 - Loading more outside a collection

Content that is not a React Aria collection (a plain list, a conversation, a grid of cards) shall load more through `LoadMore` with `autoLoad`, which requests the next page as the control comes into view, measured with `useInView` ([MEASUREMENT.md](MEASUREMENT.md#uic-measurement-41---in-view)).

Implementation: `src/components/load-more/load-more.tsx`, `src/utils/use-in-view.ts`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-COLLECTIONS-1.4 - Layout options

The geometry a virtualized layout needs shall be plain props with documented defaults: `rowHeight`, the height of every row in pixels, for a list or table layout with fixed rows (its default follows the component's `size`), or rows the layout measures itself where the component says so. A component that can lay its items out in more than one way takes a `layout` option naming them (for example `grid` or `waterfall`) rather than a building block's layout class.

Implementation: `src/components/menu/menu.tsx`
Verification: `src/components/menu/menu.test.tsx`

### UIC-COLLECTIONS-1.5 - Collections outside the building blocks

A collection component shall render through the building block's collection (list box, grid list, table, tree) unless that building block cannot render what the component needs, and a component that renders its own collection roles shall say so in its spec, with the reason and the keyboard contract it keeps in place of the building block's (focus, typeahead, selection and actions). [Relation Matrix](RELATION-MATRIX.md#uic-relation-matrix-42---the-librarys-own-grid) is such a component: it windows columns, which React Aria's table cannot.

Implementation: `src/components/relation-matrix/relation-matrix.tsx`
Verification: `src/components/relation-matrix/relation-matrix.test.tsx`

### UIC-COLLECTIONS-1.6 - Revealing items by key

A collection that reveals items by key shall do so through a `CollectionHandle` on its `handleRef`, apart from its element `ref`: `revealKey(key, options)` and `focusKey(key, options)` take the item's own key, never a row index or a building block's object, and resolve a `CollectionRevealResult`, `{ found: true }` or `{ found: false, reason }` with a `CollectionRevealMiss` (`missing`, `filtered`, `collapsed`, `paged` or `unmounted`). Revealing scrolls the item into view and leaves focus alone; only `focusKey` moves focus. The handle reveals only what the collection shows: it never expands, filters, pages or starts a load of the host's data. [Table](TABLE.md#uic-table-19---revealing-rows-by-id) and [Tree](TREE.md#uic-tree-9---revealing-rows-by-id) provide one.

Implementation: `src/core/events.ts`, `src/utils/use-collection-handle.ts`
Verification: `src/components/table/table-reveal.test.tsx`, `src/components/tree/tree-reveal.test.tsx`
