# Record Label

`RecordLabel` names a record the way engineering tools do, `REQ-12 Brake pressure limits`: an icon for its kind and its identifier, which never break apart, then its name, which gives up width first. Selectors, table cells, navigation and headings draw it; [Record Chip](RECORD-LABEL.md) builds on it.

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

## UIC-RECORD-LABEL-11 - Contract

### UIC-RECORD-LABEL-11.1 - Label and parts

`RecordLabel` shall render a `ui-record-label` `<span>` holding a `RecordLabel` (`ui-record-label__label`) built from `identifier`, `name`, `icon`, `size`, `href`, `isExternal` and `unavailable`, then, when given, `version` (`ui-record-label__version`), `type` (`ui-record-label__type`) and the `state` node (`ui-record-label__state`), usually a [Badge](BADGE.md) or [Status Light](STATUS-LIGHT.md). It publishes `data-size` (`sm`, `md` by default, `lg`).

Implementation: `src/components/record-label/record-chip-parts.tsx`, `src/components/record-label/record-label.tsx`
Verification: `src/components/record-label/record-chip.test.tsx`, `e2e/record-label-chip.spec.ts`

### UIC-RECORD-LABEL-11.2 - Layouts

`layout` shall publish `data-layout`. `inline` (the default) keeps every part on one line with the name cut in the label. `stacked` moves the label and parts into a `ui-record-label__header` line, without the name, and puts the name on a second line as a [Truncation Tooltip](TRUNCATION-TOOLTIP.md) (`ui-record-label__name`) that describes the label (`aria-describedby`), so the label's link is still read with the name.

Implementation: `src/components/record-label/record-chip-parts.tsx`, `labs/reference/record-label.css`
Verification: `src/components/record-label/record-chip.test.tsx`, `e2e/record-label-chip.spec.ts`

### UIC-RECORD-LABEL-11.3 - Preview

With `preview` and `href`, the chip shall open a `HoverCard` (`ui-record-label__preview`, also `ui-hover-card`) holding the preview when the pointer rests on the label's link or keyboard focus reaches it ([UIC-HOVER-CARD-1.2](HOVER-CARD.md#uic-hover-card-12---opening)); the link is the trigger. A record without a link has no focusable element to carry a preview, so `preview` is ignored there, as it is for an unavailable record.

Implementation: `src/components/record-label/record-chip-parts.tsx`, `src/components/hover-card/hover-card.tsx`
Verification: `src/components/record-label/record-chip.test.tsx`, `e2e/record-label-chip.spec.ts`

### UIC-RECORD-LABEL-11.4 - Remove

With `onRemove`, an extra-small `close` [Icon Button](BUTTON.md) (`ui-record-label__remove`) named by the provider's `removeItem` string with the identifier (`Remove REQ-12`) shall end the chip's first line and call `onRemove` when pressed.

Implementation: `src/components/record-label/record-chip-parts.tsx`
Verification: `src/components/record-label/record-chip.test.tsx`, `e2e/record-label-chip.spec.ts`

### UIC-RECORD-LABEL-11.5 - Unavailable records

With `unavailable`, the chip shall publish `data-unavailable`, show only the label's restricted or missing text ([UIC-RECORD-LABEL-1.5](RECORD-LABEL.md#uic-record-label-15---unavailable-records)) in the inline layout, without version, type, state, name or preview, and keep the remove button, named by that text.

Implementation: `src/components/record-label/record-chip-parts.tsx`
Verification: `src/components/record-label/record-chip.test.tsx`, `e2e/record-label-chip.spec.ts`

### UIC-RECORD-LABEL-11.6 - Hooks and caller attributes

`RecordLabel` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root. It adds no role of its own.

Implementation: `src/components/record-label/record-chip-parts.tsx`
Verification: `src/components/record-label/record-chip.test.tsx`

## UIC-RECORD-LABEL-3 - Unified options

### UIC-RECORD-LABEL-3.1 - Modes

mode shall select label (default) or chip. Both preserve record identity and links; chip adds optional metadata, preview, removal and stacked layout.

Implementation: `src/components/record-label/record-label.tsx`
Verification: `src/components/record-label/record-label.test.tsx`

### UIC-RECORD-LABEL-3.2 - References in messages

Components that carry references to records in a message's text ([UIC-MESSAGE-COMPOSER-4.9](MESSAGE-COMPOSER.md#uic-message-composer-49---record-references), [UIC-CHAT-PARTS-2.5](CHAT-PARTS.md#uic-chat-parts-25---record-references)) shall draw each one as a chip built from a `RecordLabelReference` (`{ id, label, recordType? }`: the record's opaque identity, the text the reference shows, used as the chip's identifier, and the host's kind or scope) and the `RecordLabelPresentation` a `RecordLabelResolver` returns for it (`name`, `icon`, `href`, `isExternal`, `unavailable`, `type`, `version`, `state` and `preview`). The presentation is looked up each time the chip draws and is never stored with the reference.

Implementation: `src/components/record-label/record-label.tsx`
Verification: `src/components/chat-parts/chat-text-part.test.tsx`, `src/components/message-composer/rich/composer-pill.test.tsx`

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

| `ui-record-label__label` | slot | | The record's label (also `ui-record-label`). |
| `ui-record-label__preview` | slot | | The preview card (also `ui-hover-card`). |
| `ui-record-label__header` | slot | | The first line of a stacked chip. |
| `ui-record-label__version` | slot | | The version the reference points at. |
| `ui-record-label__type` | slot | | The record's kind. |
| `ui-record-label__state` | slot | | The caller's state node. |
| `ui-record-label__remove` | slot | | The remove button (also `ui-button`). |
| `data-layout` | attribute | `inline`, `stacked` | One line, or the name on a second line. |
| `data-mode` | attribute | `label`, `chip` | Plain reference or metadata chip. |
