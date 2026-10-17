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

The table shall keep native table semantics, so a screen reader announces each cell with its column heading: no grid role, no row headers, no keyboard interaction or tab stop of its own. Controls inside cells keep their own semantics and focus. It has no name unless the caller passes `aria-label` or `aria-labelledby`; the surrounding text usually introduces it.

Implementation: `src/components/prose-table/prose-table.tsx`
Verification: `src/components/prose-table/prose-table.test.tsx`, `e2e/prose-table.spec.ts`

### UIC-PROSE-TABLE-1.4 - Hooks and caller attributes

`ProseTable` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/prose-table/prose-table.tsx`
Verification: `src/components/prose-table/prose-table.test.tsx`

## Hooks

| Hook             | Kind | Values | Description    |
| ---------------- | ---- | ------ | -------------- |
| `ui-prose-table` | root |        | The `<table>`. |
