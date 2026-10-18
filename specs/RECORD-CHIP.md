# Record Chip

`RecordChip` references a record inline, in running text, a list of links or a field value: its [Record Label](RECORD-LABEL.md), then the parts the caller has to say about it (the version it points at, its kind, its state), an optional remove button and a preview in a [Hover Card](HOVER-CARD.md). Parts the caller does not give are absent, not empty.

## UIC-RECORD-CHIP-1 - Contract

### UIC-RECORD-CHIP-1.1 - Label and parts

`RecordChip` shall render a `ui-record-chip` `<span>` holding a `RecordLabel` (`ui-record-chip__label`) built from `identifier`, `name`, `icon`, `size`, `href`, `isExternal` and `unavailable`, then, when given, `version` (`ui-record-chip__version`), `type` (`ui-record-chip__type`) and the `state` node (`ui-record-chip__state`), usually a [Badge](BADGE.md) or [Status Light](STATUS-LIGHT.md). It publishes `data-size` (`sm`, `md` by default, `lg`).

Implementation: `src/components/record-chip/record-chip.tsx`, `src/components/record-label/record-label.tsx`
Verification: `src/components/record-chip/record-chip.test.tsx`, `e2e/record-chip.spec.ts`

### UIC-RECORD-CHIP-1.2 - Layouts

`layout` shall publish `data-layout`. `inline` (the default) keeps every part on one line with the name cut in the label. `stacked` moves the label and parts into a `ui-record-chip__header` line, without the name, and puts the name on a second line as a [Truncation Tooltip](TRUNCATION-TOOLTIP.md) (`ui-record-chip__name`) that describes the label (`aria-describedby`), so the label's link is still read with the name.

Implementation: `src/components/record-chip/record-chip.tsx`, `labs/reference/record-chip.css`
Verification: `src/components/record-chip/record-chip.test.tsx`, `e2e/record-chip.spec.ts`

### UIC-RECORD-CHIP-1.3 - Preview

With `preview` and `href`, the chip shall open a `HoverCard` (`ui-record-chip__preview`, also `ui-hover-card`) holding the preview when the pointer rests on the label's link or keyboard focus reaches it ([UIC-HOVER-CARD-1.2](HOVER-CARD.md#uic-hover-card-12---opening)); the link is the trigger. A record without a link has no focusable element to carry a preview, so `preview` is ignored there, as it is for an unavailable record.

Implementation: `src/components/record-chip/record-chip.tsx`, `src/components/hover-card/hover-card.tsx`
Verification: `src/components/record-chip/record-chip.test.tsx`, `e2e/record-chip.spec.ts`

### UIC-RECORD-CHIP-1.4 - Remove

With `onRemove`, an extra-small `close` [Icon Button](ICON-BUTTON.md) (`ui-record-chip__remove`) named by the provider's `removeItem` string with the identifier (`Remove REQ-12`) shall end the chip's first line and call `onRemove` when pressed.

Implementation: `src/components/record-chip/record-chip.tsx`
Verification: `src/components/record-chip/record-chip.test.tsx`, `e2e/record-chip.spec.ts`

### UIC-RECORD-CHIP-1.5 - Unavailable records

With `unavailable`, the chip shall publish `data-unavailable`, show only the label's restricted or missing text ([UIC-RECORD-LABEL-1.5](RECORD-LABEL.md#uic-record-label-15---unavailable-records)) in the inline layout, without version, type, state, name or preview, and keep the remove button, named by that text.

Implementation: `src/components/record-chip/record-chip.tsx`
Verification: `src/components/record-chip/record-chip.test.tsx`, `e2e/record-chip.spec.ts`

### UIC-RECORD-CHIP-1.6 - Hooks and caller attributes

`RecordChip` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root. It adds no role of its own.

Implementation: `src/components/record-chip/record-chip.tsx`
Verification: `src/components/record-chip/record-chip.test.tsx`

## Hooks

| Hook                      | Kind      | Values                  | Description                                  |
| ------------------------- | --------- | ----------------------- | -------------------------------------------- |
| `ui-record-chip`          | root      |                         | The chip (`<span>`).                         |
| `ui-record-chip__label`   | slot      |                         | The record's label (also `ui-record-label`). |
| `ui-record-chip__preview` | slot      |                         | The preview card (also `ui-hover-card`).     |
| `ui-record-chip__header`  | slot      |                         | The first line of a stacked chip.            |
| `ui-record-chip__version` | slot      |                         | The version the reference points at.         |
| `ui-record-chip__type`    | slot      |                         | The record's kind.                           |
| `ui-record-chip__state`   | slot      |                         | The caller's state node.                     |
| `ui-record-chip__name`    | slot      |                         | The name on a stacked chip's second line.    |
| `ui-record-chip__remove`  | slot      |                         | The remove button (also `ui-icon-button`).   |
| `data-layout`             | attribute | `inline`, `stacked`     | One line, or the name on a second line.      |
| `data-size`               | attribute | `sm`, `md`, `lg`        | Label size.                                  |
| `data-unavailable`        | attribute | `restricted`, `missing` | Why the record cannot be shown.              |
