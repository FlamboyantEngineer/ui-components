# Equipment Stack

`EquipmentStack` shows a read-only, ordered stack of faces drawn to scale, such as the units mounted one above another in a cabinet. Each face has a height in stack units, and one unit's height is the stack's width divided by a fixed ratio, so the drawing keeps its proportions at every width. The caller owns the faces, their readouts and statuses and what a missing unit means; the stack owns no selection, editing, polling or measurement.

## UIC-EQUIPMENT-STACK-1 - Structure

### UIC-EQUIPMENT-STACK-1.1 - Ordered faces

`EquipmentStack` shall render an `<ol>` root and one `<li>` in the `ui-equipment-stack__face` slot for each of `faces`, in the given order from the top, keyed by each face's `id` so a face keeps its element while faces are added, removed or reordered. Each face shows its `label` in the `ui-equipment-stack__label` slot first. The faces are read-only: the stack adds no tab stop, role or live region beyond the native list.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`
Verification: `src/components/equipment-stack/equipment-stack.test.tsx`, `e2e/equipment-stack.spec.ts`

### UIC-EQUIPMENT-STACK-1.2 - Readout and status slots

A face's `readout` shall render in the `ui-equipment-stack__readout` slot and its `status` in the `ui-equipment-stack__status` slot, after the label and in that order. Both accept any content the caller formats; `null`, `undefined`, boolean and empty-string content renders no slot, and zero does.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`
Verification: `src/components/equipment-stack/equipment-stack.test.tsx`, `e2e/equipment-stack.spec.ts`

### UIC-EQUIPMENT-STACK-1.3 - Missing units

A face with `isMissing` shall keep its place and height, carry `data-missing="true"`, and show the stack's `missingPlaceholder` in the `ui-equipment-stack__placeholder` slot in place of its readout and status, which it does not render. Without a placeholder, a missing face shows only its label.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`
Verification: `src/components/equipment-stack/equipment-stack.test.tsx`, `e2e/equipment-stack.spec.ts`

## UIC-EQUIPMENT-STACK-2 - Proportions

### UIC-EQUIPMENT-STACK-2.1 - Width-to-unit ratio

The root shall publish `unitRatio`, the stack's width divided by the height of one unit, as `--ui-equipment-stack-ratio`, and each face its `units` as `--ui-equipment-stack-units`. Units may be fractional; a ratio or a face's units that is not a positive finite number is published as `1`. The stylesheet sizes each face to `ratio / units` of its width, so face heights stay proportional to their units at every stack width. The reference sheet does so with `aspect-ratio` and no gap between faces, so the faces together are exactly as tall as their units add up to, and clips a face's content to its height instead of letting the content stretch the face.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`, `labs/reference/equipment-stack.css`
Verification: `src/components/equipment-stack/equipment-stack.test.tsx`, `e2e/equipment-stack.spec.ts`

### UIC-EQUIPMENT-STACK-2.2 - Scrolling

A stack taller than its scrolling container shall keep its face order and proportions while the container or the viewport scrolls or resizes: faces never shrink to fit the container, and the stack does not reorder, reflow or rescale them as they scroll in and out of view.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`, `labs/reference/equipment-stack.css`
Verification: `e2e/equipment-stack.spec.ts`

## UIC-EQUIPMENT-STACK-3 - States and accessibility

### UIC-EQUIPMENT-STACK-3.1 - Name

The stack shall take its accessible name from `aria-label` or `aria-labelledby`, and a description from `aria-describedby`, on the `<ol>`. Each face is read as a list item made of its label, then its readout and status or its placeholder.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`
Verification: `src/components/equipment-stack/equipment-stack.test.tsx`, `e2e/equipment-stack.spec.ts`

### UIC-EQUIPMENT-STACK-3.2 - Hooks and caller attributes

`EquipmentStack` shall carry the hooks below, append the caller's `className` to its root, and forward caller `data-*` attributes, `id` and `ref` to the `<ol>`.

Implementation: `src/components/equipment-stack/equipment-stack.tsx`
Verification: `src/components/equipment-stack/equipment-stack.test.tsx`

## Hooks

| Hook                              | Kind     | Values | Description                                                  |
| --------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| `ui-equipment-stack`              | root     |        | The `<ol>`.                                                  |
| `ui-equipment-stack__face`        | slot     |        | One face's `<li>`.                                           |
| `ui-equipment-stack__label`       | slot     |        | The face's label.                                            |
| `ui-equipment-stack__readout`     | slot     |        | The face's readout, when it has one and is not missing.      |
| `ui-equipment-stack__status`      | slot     |        | The face's status, when it has one and is not missing.       |
| `ui-equipment-stack__placeholder` | slot     |        | A missing face's placeholder, when the stack has one.        |
| `data-missing`                    | state    | `true` | On a face: its unit is absent.                               |
| `--ui-equipment-stack-ratio`      | property |        | On the root: the stack's width divided by one unit's height. |
| `--ui-equipment-stack-units`      | property |        | On a face: its height in units.                              |
