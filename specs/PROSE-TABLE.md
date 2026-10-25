# Prose Table

`ProseTable` is a table that belongs to running text, such as a Markdown table in an article or an answer: plain column headings and body rows that take the typography of the text around them, with no selection, sorting, resizing or row actions. Data a reader works with belongs in an interactive table instead.

## UIC-PROSE-TABLE-1 - Contract

### UIC-PROSE-TABLE-1.1 - Headings and rows

`ProseTable` shall render a `<table>` root with one `<thead>` row of `<th scope="col">` headings from `header` and one `<tbody>` row of `<td>` cells per entry of `rows`, each cell showing its `content` as given (inline markup, links, controls). Keys come from the caller's cell and row `key`s.

Implementation: `src/components/prose-table/prose-table.tsx`, `labs/reference/prose-table.css`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-1.2 - Complete rows

A row with fewer cells than headings shall be padded with empty cells, so every row has a cell under every heading.

Implementation: `src/components/prose-table/prose-table.tsx`
Verification: `src/components/prose-table/prose-table.test.tsx`

### UIC-PROSE-TABLE-1.3 - Native semantics

The table shall keep native table semantics, so a screen reader announces each cell with its column heading: no grid role, no keyboard interaction or tab stop of its own, and row headers only for a column marked as one ([UIC-PROSE-TABLE-2.3](#uic-prose-table-23---row-headers)). Controls inside cells keep their own semantics and focus. It has no name unless it has a `caption` or the caller passes `aria-label` or `aria-labelledby`; the surrounding text usually introduces it.

Implementation: `src/components/prose-table/prose-table.tsx`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-1.4 - Hooks and caller attributes

`ProseTable` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/prose-table/prose-table.tsx`
Verification: `src/components/prose-table/prose-table.test.tsx`

## UIC-PROSE-TABLE-2 - Table parts

### UIC-PROSE-TABLE-2.1 - Caption

`caption` shall render as the table's first child, a `<caption>` in the `ui-prose-table__caption` slot, which names the table. Nullish, boolean and empty-string captions render none.

Implementation: `src/components/prose-table/prose-table.tsx`, `labs/reference/prose-table.css`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-2.2 - Footer rows

`footer` rows, such as totals, shall render after the body in a `<tfoot>`, built and padded like body rows. Without footer rows there is no `<tfoot>`.

Implementation: `src/components/prose-table/prose-table.tsx`, `labs/reference/prose-table.css`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-2.3 - Row headers

The cells of a column whose heading sets `isRowHeader` shall render as `<th scope="row">` in body and footer rows, so a screen reader announces each cell with its row's name as well as its column heading.

Implementation: `src/components/prose-table/prose-table.tsx`, `labs/reference/prose-table.css`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-2.4 - Column alignment

A heading's `align` (`start`, `center` or `end`, as in Markdown's `:---`, `:---:` and `---:`) shall be published in `data-align` on the heading and on every body and footer cell of its column, padding cells included. A column without `align` publishes nothing and the stylesheet aligns it; the reference sheet aligns `end` columns' figures with tabular numerals.

Implementation: `src/components/prose-table/prose-table.tsx`, `labs/reference/prose-table.css`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-2.5 - Sticky header and scrolling

`stickyHeader` shall publish `data-sticky-header`, from which the stylesheet keeps the heading row at the top of the nearest scrolling ancestor while the rows scroll under it. A table that needs its own scroll area, because it is tall or wider than the text column, is placed in a [Scroll Region](SCROLL-REGION.md); the table renders no scroll container of its own. The sticky-header lab shall start its headings at the scroll viewport edge and keep exactly that position from the first pixel of scrolling.

Implementation: `src/components/prose-table/prose-table.tsx`, `labs/reference/prose-table.css`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`, `e2e/lab-layout-regressions.spec.ts`

## Hooks

| Hook                      | Kind      | Values                   | Description                                                  |
| ------------------------- | --------- | ------------------------ | ------------------------------------------------------------ |
| `ui-prose-table`          | root      |                          | The `<table>`.                                               |
| `ui-prose-table__caption` | slot      |                          | The `<caption>`, when given.                                 |
| `data-align`              | attribute | `start`, `center`, `end` | On a heading and its column's cells, when the column aligns. |
| `data-sticky-header`      | state     | `true`                   | The heading row sticks to the top of a scrolling ancestor.   |
