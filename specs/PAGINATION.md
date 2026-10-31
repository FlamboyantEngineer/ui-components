# Pagination

`Pagination` moves through a list shown one page at a time: previous and next buttons around one button per page, with gaps where a long run of pages is skipped. It is built on the library's `Button` and `Button` and holds no rows itself; [Table](TABLE.md#uic-table-10---pagination) draws one under a paginated grid.

## UIC-PAGINATION-1 - Pages

### UIC-PAGINATION-1.1 - Navigation

`Pagination` shall render a `nav` landmark (the `ui-pagination` root) named by `aria-label`, else the provider's `pagination` string, around a list (`ui-pagination__list`) whose items (`ui-pagination__item`) hold a previous button (`ui-pagination__previous`, named by the provider's `previousPage` string), one button per listed page (`ui-pagination__page`, showing the page number in the locale's digits and named `Page <n>` by the provider's `pageNumber` string) and a next button (`ui-pagination__next`, named by `nextPage`). The previous and next buttons draw the `chevron-left` and `chevron-right` glyphs, swapped in a right-to-left locale.

Implementation: `src/components/pagination/pagination.tsx`, `src/core/strings/content.ts`
Verification: `src/components/pagination/pagination.test.tsx`, `e2e/pagination.spec.ts`

### UIC-PAGINATION-1.2 - Current page

The current page's button shall carry `aria-current="page"` and `data-current`. `page` controls the current page, else the pagination owns it starting at `defaultPage` (1 by default); a page outside 1 to `pageCount` shows the nearest one, and a `pageCount` below one counts as one.

Implementation: `src/components/pagination/pagination.tsx`
Verification: `src/components/pagination/pagination.test.tsx`

### UIC-PAGINATION-1.3 - Moving between pages

Pressing a page button, or previous or next, by pointer or keyboard, shall call `onPageChange` with that page; pressing the current page does nothing. Previous is disabled on the first page and next on the last, as `aria-disabled` buttons that keep focus, so paging with the keyboard never drops focus to the page.

Implementation: `src/components/pagination/pagination.tsx`
Verification: `src/components/pagination/pagination.test.tsx`, `e2e/pagination.spec.ts`

### UIC-PAGINATION-1.4 - Page list

Up to seven pages shall all be listed. Beyond that the list holds the first and last pages, the current page with one page on each side, and a decorative gap (`ui-pagination__ellipsis`, hidden from assistive technology) wherever pages are skipped; a gap that would stand for a single page shows that page instead, so the list always holds seven entries.

Implementation: `src/components/pagination/pagination.tsx`
Verification: `src/components/pagination/pagination.test.tsx`

### UIC-PAGINATION-1.5 - Disabled

`isDisabled` shall disable every button and publish `data-disabled` on the root.

Implementation: `src/components/pagination/pagination.tsx`
Verification: `src/components/pagination/pagination.test.tsx`

### UIC-PAGINATION-1.6 - Hooks and caller attributes

`Pagination` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to the `nav`.

Implementation: `src/components/pagination/pagination.tsx`
Verification: `src/components/pagination/pagination.test.tsx`

## Hooks

| Hook                      | Kind  | Values | Description                                                         |
| ------------------------- | ----- | ------ | ------------------------------------------------------------------- |
| `ui-pagination`           | root  |        | The `<nav>` landmark.                                               |
| `ui-pagination__list`     | slot  |        | The list (`<ul>`).                                                  |
| `ui-pagination__item`     | slot  |        | One entry (`<li>`).                                                 |
| `ui-pagination__previous` | slot  |        | The previous button (also `ui-button`).                             |
| `ui-pagination__next`     | slot  |        | The next button (also `ui-button`).                                 |
| `ui-pagination__page`     | slot  |        | One page's button (also `ui-button`).                               |
| `ui-pagination__ellipsis` | slot  |        | A gap standing for skipped pages.                                   |
| `data-current`            | state | `true` | The current page's button.                                          |
| `data-disabled`           | state | `true` | The root while every button is disabled, and each disabled control. |
