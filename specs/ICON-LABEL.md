# Icon Label

`IconLabel` pairs a decorative leading icon with text. It inherits the host's font, line height and colour; its size chooses only the icon box and the gap the stylesheet puts between them.

## UIC-ICON-LABEL-1 - Contract

### UIC-ICON-LABEL-1.1 - Icon and label

`IconLabel` shall draw its `icon` (an imported icon component or rendered element) as a decorative `Icon` in the `ui-icon-label__icon` slot, followed by its `label` (text or nodes) in the `ui-icon-label__label` slot. It adds no role, tab stop or accessible name of its own; the label text names it.

Implementation: `src/components/icon-label/icon-label.tsx`
Verification: `src/components/icon-label/icon-label.test.tsx`, `e2e/icon-label.spec.ts`

### UIC-ICON-LABEL-1.2 - Size

`size` (`sm`, `md` by default, `lg`) shall size the icon and publish `data-size` on the root, from which the stylesheet sets the gap. The reference sheet uses 12/4, 16/8 and 20/12 pixel icon and gap pairs.

Implementation: `src/components/icon-label/icon-label.tsx`, `labs/reference/icon-label.css`
Verification: `src/components/icon-label/icon-label.test.tsx`, `e2e/icon-label.spec.ts`

### UIC-ICON-LABEL-1.3 - Layout options

`truncate` shall publish `data-truncate` so the stylesheet keeps the label on one line and ellipsizes it, while the full text stays in the DOM. `grow` shall publish `data-grow` so the label takes the host row's free width. `collapsible` shall publish `data-collapsible`, marking text the stylesheet may hide when the label itself is narrow; the reference stylesheet makes a collapsible label its own container (`ui-icon-label`), 12rem wide where nothing constrains it, and hides the text, kept for assistive technology, when its room is under 8rem.

Implementation: `src/components/icon-label/icon-label.tsx`, `labs/reference/icon-label.css`
Verification: `src/components/icon-label/icon-label.test.tsx`, `e2e/icon-label.spec.ts`

### UIC-ICON-LABEL-1.4 - Visibility and announcements

`hidden` shall hide the whole label and `hideLabel` only its text, both with the native `hidden` attribute; with `hideLabel` the host control supplies the accessible name. `live` (`polite` or `assertive`) shall announce label changes; by default the label is quiet.

Implementation: `src/components/icon-label/icon-label.tsx`
Verification: `src/components/icon-label/icon-label.test.tsx`

### UIC-ICON-LABEL-1.5 - Hooks and caller attributes

`IconLabel` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/icon-label/icon-label.tsx`
Verification: `src/components/icon-label/icon-label.test.tsx`

### UIC-ICON-LABEL-1.6 - Full text of a cut label

With `truncate`, the label shall be a [Truncation Tooltip](TRUNCATION-TOOLTIP.md) that also carries the `ui-icon-label__label` class: while the stylesheet cuts it, resting the pointer on it, or keyboard focus on the control holding it, shows the whole label in that component's visual-only tooltip. A label that fits shows nothing.

Implementation: `src/components/icon-label/icon-label.tsx`
Verification: `src/components/icon-label/icon-label.test.tsx`, `e2e/icon-label.spec.ts`

## Hooks

| Hook                   | Kind      | Values           | Description                                                    |
| ---------------------- | --------- | ---------------- | -------------------------------------------------------------- |
| `ui-icon-label`        | root      |                  | The `<span>` holding icon and label.                           |
| `ui-icon-label__icon`  | slot      |                  | The leading `Icon` (also `ui-icon`).                           |
| `ui-icon-label__label` | slot      |                  | The label text; with `truncate`, also `ui-truncation-tooltip`. |
| `data-size`            | attribute | `sm`, `md`, `lg` | Icon box and gap size.                                         |
| `data-truncate`        | state     | `true`           | One line, ellipsized by the stylesheet.                        |
| `data-grow`            | state     | `true`           | Takes the host row's free width.                               |
| `data-collapsible`     | state     | `true`           | The stylesheet may hide the text.                              |
