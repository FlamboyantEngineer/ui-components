# Label

`Label` draws text with an optional decorative leading icon, or an icon alone; it replaces the former `IconLabel`, and [Meta Line](META-LINE.md) draws its entries with it. It inherits the host's font, line height and colour; its size chooses only the icon box and the gap the stylesheet puts between them.

## UIC-LABEL-1 - Contract

### UIC-LABEL-1.1 - Icon and label

`Label` shall draw its `icon` (an imported icon component or rendered element) as a decorative `Icon` in the `ui-label__icon` slot, followed by its `label` (text or nodes) in the `ui-label__label` slot. It adds no role, tab stop or accessible name of its own; the label text names it. Both are optional: without an `icon` it draws no icon slot, and without a `label` (empty, `null` or `false`) no label slot, leaving an icon the host names, as with `hideLabel`.

Implementation: `src/components/label/label.tsx`
Verification: `src/components/label/label.test.tsx`, `e2e/label.spec.ts`

### UIC-LABEL-1.2 - Size

`size` (`sm`, `md` by default, `lg`) shall size the icon and publish `data-size` on the root, from which the stylesheet sets the gap. The reference sheet uses 12/4, 16/8 and 20/12 pixel icon and gap pairs.

Implementation: `src/components/label/label.tsx`, `labs/reference/label.css`
Verification: `src/components/label/label.test.tsx`, `e2e/label.spec.ts`

### UIC-LABEL-1.3 - Layout options

`truncate` shall publish `data-truncate` so the stylesheet keeps the label on one line and ellipsizes it, while the full text stays in the DOM. `grow` shall publish `data-grow` so the label takes the host row's free width. `collapsible` shall publish `data-collapsible`, marking text the stylesheet may hide when the label itself is narrow; the reference stylesheet makes a collapsible label its own container (`ui-label`), 12rem wide where nothing constrains it, and hides the text, kept for assistive technology, when its room is under 8rem.

Implementation: `src/components/label/label.tsx`, `labs/reference/label.css`
Verification: `src/components/label/label.test.tsx`, `e2e/label.spec.ts`

### UIC-LABEL-1.4 - Visibility and announcements

`hidden` shall hide the whole label and `hideLabel` only its text, both with the native `hidden` attribute; with `hideLabel` the host control supplies the accessible name. `live` (`polite` or `assertive`) shall announce label changes; by default the label is quiet.

Implementation: `src/components/label/label.tsx`
Verification: `src/components/label/label.test.tsx`

### UIC-LABEL-1.5 - Hooks and caller attributes

`Label` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its `<span>` root.

Implementation: `src/components/label/label.tsx`
Verification: `src/components/label/label.test.tsx`

### UIC-LABEL-1.6 - Full text of a cut label

With `truncate`, the label shall be a [Truncation Tooltip](TRUNCATION-TOOLTIP.md) that also carries the `ui-label__label` class: while the stylesheet cuts it, resting the pointer on it, or keyboard focus on the control holding it, shows the whole label in that component's visual-only tooltip. A label that fits shows nothing.

Implementation: `src/components/label/label.tsx`
Verification: `src/components/label/label.test.tsx`, `e2e/label.spec.ts`

## Hooks

| Hook               | Kind      | Values           | Description                                                    |
| ------------------ | --------- | ---------------- | -------------------------------------------------------------- |
| `ui-label`         | root      |                  | The `<span>` holding icon and label.                           |
| `ui-label__icon`   | slot      |                  | The leading `Icon` (also `ui-icon`).                           |
| `ui-label__label`  | slot      |                  | The label text; with `truncate`, also `ui-truncation-tooltip`. |
| `data-size`        | attribute | `sm`, `md`, `lg` | Icon box and gap size.                                         |
| `data-truncate`    | state     | `true`           | One line, ellipsized by the stylesheet.                        |
| `data-grow`        | state     | `true`           | Takes the host row's free width.                               |
| `data-collapsible` | state     | `true`           | The stylesheet may hide the text.                              |
