# Description List

`DescriptionList` and `DescriptionRow` show read-only facts as label and value pairs in a native description list. They own no editing, validation, filtering, loading or persistence; a caller decides which rows to show.

## UIC-DESCRIPTION-LIST-1 - Structure

### UIC-DESCRIPTION-LIST-1.1 - Native groups

`DescriptionList` shall render a `<dl>` root, and each `DescriptionRow` a `<div>` in the `ui-description-list__row` slot grouping one `<dt>` (`ui-description-list__label`) and its `<dd>` value (`ui-description-list__value`). Labels and values accept any content and are shown as given: zero and empty values stay, and no punctuation is added to labels.

Implementation: `src/components/description-list/description-list.tsx`
Verification: `src/components/description-list/description-list.test.tsx`, `e2e/description-list.spec.ts`

### UIC-DESCRIPTION-LIST-1.2 - Second definition

A row's `secondary` content shall render as a second `<dd>` in the `ui-description-list__secondary` slot after the value. `null`, `undefined`, boolean and empty-string content adds no second definition; zero does.

Implementation: `src/components/description-list/description-list.tsx`
Verification: `src/components/description-list/description-list.test.tsx`

### UIC-DESCRIPTION-LIST-1.3 - Layout and columns

`layout` (`inline` by default, or `stacked`) and `columns` (`1` by default, `2`, `3` or `4`) shall be published as `data-layout` and `data-columns` on the root. The stylesheet aligns inline rows on shared label and value tracks, puts stacked values below their labels, and may lay rows out in up to four columns. The reference sheet wraps long values without clipping and reduces several columns to one on a viewport narrower than 44rem.

Implementation: `src/components/description-list/description-list.tsx`, `labs/reference/description-list.css`
Verification: `src/components/description-list/description-list.test.tsx`, `e2e/description-list.spec.ts`

### UIC-DESCRIPTION-LIST-1.4 - Row span

A row's `span` (`1` by default, `2`, `3`, `4` or `full`) shall be published as `data-span` on the row, the number of the list's columns it covers, `full` covering the whole line. In the reference sheet an inline row's value and second definition stretch across the covered columns, and a span wider than the list covers the whole line.

Implementation: `src/components/description-list/description-list.tsx`, `labs/reference/description-list.css`
Verification: `src/components/description-list/description-list.test.tsx`, `e2e/description-list.spec.ts`

### UIC-DESCRIPTION-LIST-1.5 - Formatted values

A row without children shall show its `value` formatted for the provider's locale ([PROVIDER.md](PROVIDER.md)): a number or a `{ start, end }` number range with `Intl.NumberFormat`, an ISO 8601 date or date and time text (`2026-05-14`, `2026-05-14T09:30`), or a range of them, with `Intl.DateTimeFormat` (a medium date unless `formatOptions` says otherwise), reading the text in the formatter's time zone so a calendar date never shifts a day (a text that is not a date shows as written), and a list of texts with `Intl.ListFormat` (a conjunction by default). `formatOptions` passes `Intl` options for the value's kind. Children, when given, are shown instead. `formatDescriptionValue(value, { locale, formatOptions })` exposes the same text.

Implementation: `src/components/description-list/description-list.tsx`, `src/components/description-list/format-description-value.ts`, `src/utils/read-time-instant.ts`
Verification: `src/components/description-list/description-list.test.tsx`, `e2e/description-list.spec.ts`

## UIC-DESCRIPTION-LIST-2 - States and accessibility

### UIC-DESCRIPTION-LIST-2.1 - Visibility and focus

`hidden` shall hide the whole list with the native attribute. Rows have no tab stop by default; a caller that makes a row a focus target passes `tabIndex` and its `onClick`, `onKeyDown`, `onContextMenu`, `onFocus` and `onBlur` handlers, `aria-label` and `aria-describedby`, which the row forwards and keeps through value updates.

Implementation: `src/components/description-list/description-list.tsx`
Verification: `src/components/description-list/description-list.test.tsx`

### UIC-DESCRIPTION-LIST-2.2 - No added semantics

The list shall add no role, live region or status; its name, when needed, comes from `aria-label` or `aria-labelledby` on the root.

Implementation: `src/components/description-list/description-list.tsx`
Verification: `src/components/description-list/description-list.test.tsx`, `e2e/description-list.spec.ts`

### UIC-DESCRIPTION-LIST-2.3 - Hooks and caller attributes

`DescriptionList` and `DescriptionRow` shall carry the hooks below, append the caller's `className` to their own element, and forward caller `data-*` attributes and `id` to it.

Implementation: `src/components/description-list/description-list.tsx`
Verification: `src/components/description-list/description-list.test.tsx`

## Hooks

| Hook                             | Kind      | Values                     | Description                                 |
| -------------------------------- | --------- | -------------------------- | ------------------------------------------- |
| `ui-description-list`            | root      |                            | The `<dl>`.                                 |
| `ui-description-list__row`       | slot      |                            | One row's `<div>`, from `DescriptionRow`.   |
| `ui-description-list__label`     | slot      |                            | The row's `<dt>`.                           |
| `ui-description-list__value`     | slot      |                            | The row's value `<dd>`.                     |
| `ui-description-list__secondary` | slot      |                            | The row's second `<dd>`, when it has one.   |
| `data-layout`                    | attribute | `inline`, `stacked`        | Label and value arrangement.                |
| `data-columns`                   | attribute | `1`, `2`, `3`, `4`         | Columns of rows the stylesheet may lay out. |
| `data-span`                      | attribute | `1`, `2`, `3`, `4`, `full` | On a row: the list columns it covers.       |
