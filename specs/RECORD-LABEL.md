# Record Label

`RecordLabel` names a record the way engineering tools do, `REQ-12 Brake pressure limits`: an icon for its kind and its identifier, which never break apart, then its name, which gives up width first. Selectors, table cells, navigation and headings draw it; [Record Chip](RECORD-CHIP.md) builds on it.

## UIC-RECORD-LABEL-1 - Contract

### UIC-RECORD-LABEL-1.1 - Identity and name

`RecordLabel` shall render a `ui-record-label` root holding a `ui-record-label__identity` element with the decorative `icon` (a glyph name or icon node, in the `ui-record-label__icon` slot) and the `identifier` (`ui-record-label__identifier`), then, when `name` is not blank, a space and the trimmed name in the `ui-record-label__name` slot. The reference sheet keeps the identity on one line. Text is rendered as text, never as markup.

Implementation: `src/components/record-label/record-label.tsx`, `labs/reference/record-label.css`
Verification: `src/components/record-label/record-label.test.tsx`, `e2e/record-label.spec.ts`

### UIC-RECORD-LABEL-1.2 - Truncation

By default (`truncate`, published in `data-truncate`) the name shall be a [Truncation Tooltip](TRUNCATION-TOOLTIP.md): kept on one line, cut by the stylesheet and shown whole in a tooltip on hover or keyboard focus of the label's link. With `truncate={false}` it is a plain `<span>` that wraps.

Implementation: `src/components/record-label/record-label.tsx`, `labs/reference/record-label.css`
Verification: `src/components/record-label/record-label.test.tsx`, `e2e/record-label.spec.ts`

### UIC-RECORD-LABEL-1.3 - Link

With `href` the root shall be a library [Link](LINK.md) (also `ui-link`, `secondary`, underlined on hover) to the record, rendered through the provider's link renderer, whose text is the whole label; `isExternal` opens it in a new tab and says so. Without `href` the root is a `<span>` with no role or tab stop. `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-details` reach the link. A `<span>` cannot carry a name, so without a link `aria-describedby` and `aria-details` reach it, an `aria-label` is read in place of the visible text from a visually hidden `ui-record-label__accessible-label` slot (the identity and name hidden from assistive technology), and `aria-labelledby` is not set.

Implementation: `src/components/record-label/record-label.tsx`, `src/components/link/link.tsx`
Verification: `src/components/record-label/record-label.test.tsx`, `e2e/record-label.spec.ts`

### UIC-RECORD-LABEL-1.4 - Sizes

`size` (`sm`, `md` by default, `lg`) shall publish `data-size` on the root and size the icon to match.

Implementation: `src/components/record-label/record-label.tsx`, `labs/reference/record-label.css`
Verification: `src/components/record-label/record-label.test.tsx`, `e2e/record-label.spec.ts`

### UIC-RECORD-LABEL-1.5 - Unavailable records

`unavailable` (`restricted` or `missing`, published in `data-unavailable`) shall show only that: the `lock` or `warning` glyph and the provider's `recordUnavailable` string (`Restricted item`, `Missing item`) in place of the icon and identifier, with no name and no link.

Implementation: `src/components/record-label/record-label.tsx`, `src/core/content-strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/record-label/record-label.test.tsx`, `e2e/record-label.spec.ts`

### UIC-RECORD-LABEL-1.6 - Hooks and caller attributes

`RecordLabel` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/record-label/record-label.tsx`
Verification: `src/components/record-label/record-label.test.tsx`

## Hooks

| Hook                                | Kind      | Values                  | Description                                             |
| ----------------------------------- | --------- | ----------------------- | ------------------------------------------------------- |
| `ui-record-label`                   | root      |                         | The label: a `<span>`, or the link (also `ui-link`).    |
| `ui-record-label__identity`         | slot      |                         | The icon and identifier, which never break apart.       |
| `ui-record-label__icon`             | slot      |                         | The decorative icon (also `ui-icon`).                   |
| `ui-record-label__identifier`       | slot      |                         | The identifier, or the unavailable record's text.       |
| `ui-record-label__name`             | slot      |                         | The name (also `ui-truncation-tooltip` when cut).       |
| `ui-record-label__accessible-label` | slot      |                         | Visually hidden `aria-label` of a label without a link. |
| `data-size`                         | attribute | `sm`, `md`, `lg`        | Icon and text size.                                     |
| `data-truncate`                     | attribute | `true`                  | The name stays on one line and is cut.                  |
| `data-unavailable`                  | attribute | `restricted`, `missing` | Why the record cannot be shown.                         |
