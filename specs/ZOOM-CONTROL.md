# Zoom Control

`ZoomControl` shows a zoom percentage and requests other zoom levels from its caller: a zoom-out button, a slider over a ladder of zoom levels, a zoom-in button and the current percentage, in that order, in one named group, with an optional preset menu and reset button after them.

## UIC-ZOOM-CONTROL-1 - Contract

### UIC-ZOOM-CONTROL-1.1 - Parts and order

`ZoomControl` shall render a `role="group"` element named by `aria-label`, `aria-labelledby` or the provider's `zoom` string, holding in order: the zoom-out button (`ui-zoom-control__zoom-out`), the slider (`ui-zoom-control__slider`), the zoom-in button (`ui-zoom-control__zoom-in`) and the value (`ui-zoom-control__value`). The built-in buttons are [Icon Buttons](BUTTON.md) drawing the `minus` and `plus` glyphs, named by the provider's `zoomOut` and `zoomIn` strings.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

### UIC-ZOOM-CONTROL-1.2 - Levels and value

`levels` shall give the zoom levels in percent (`100` means 100%), used sorted ascending without duplicates or non-finite entries; without it the control uses `defaultZoomLevels`. The current zoom is `value` (controlled) or `defaultValue` (uncontrolled, `100` by default), and every request reaches `onChange` with the requested percentage; an uncontrolled control also applies it. The value may lie between levels, for example a fit-to-width zoom. Normalisation is shared by the slider and step buttons, and retained while the levels stay the same.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`

### UIC-ZOOM-CONTROL-1.3 - Stepping

Zoom in shall request the first level above the current value and zoom out the last level below it, so a value between levels steps to the neighbouring level on that side. With no level beyond the value on its side, a step button is disabled but stays focusable (`aria-disabled="true"`, `data-disabled`), so focus is not lost when a step reaches the first or last level. `findNextZoomLevel` exposes the same rule.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

### UIC-ZOOM-CONTROL-1.4 - Slider

The slider shall be a native `<input type="range">` over its stops, from `0` to the last stop in steps of one: the levels, and the current value as a stop of its own while it lies between levels or past either end. Its value is the current value's stop, so one step with the arrow keys from any value reaches the neighbouring level on that side, endpoints included, as the step buttons do (UIC-ZOOM-CONTROL-1.3); Home and End reach the first and last stop, and a drag can return to the current value. It is named by the provider's `zoomLevel` string and announces the formatted value through `aria-valuetext`. Moving it requests the level at the new stop. The arrow keys follow the browser's native range, mirrored right to left.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

### UIC-ZOOM-CONTROL-1.5 - Value display

The value shall be an `<output>` for the slider showing the current value formatted for the locale as a percentage, without rounding (`137.5` shows `137.5%`), whether or not it is one of the levels. `formatOptions` changes the number format; it applies to the percentage itself. The element stays mounted as the value changes.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

### UIC-ZOOM-CONTROL-1.6 - Reset

With `resetValue`, the control shall render a reset [Icon Button](BUTTON.md) after the value (`ui-zoom-control__reset`, `restore` glyph, named by the provider's `resetZoom` string) that requests `resetValue`. It is disabled but focusable while the value equals `resetValue`.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`

### UIC-ZOOM-CONTROL-1.7 - Disabled

`isDisabled` shall natively disable the slider and the built-in buttons and publish `data-disabled` on the root.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

### UIC-ZOOM-CONTROL-1.8 - Caller-supplied step buttons

`zoomOutButton` and `zoomInButton` shall replace the built-in step buttons in their positions, for callers whose zoom steps are commands of their own. The control keeps the slider and the value display.

Implementation: `src/components/zoom-control/zoom-control.tsx`
Verification: `src/components/zoom-control/zoom-control.test.tsx`

### UIC-ZOOM-CONTROL-1.9 - Size, hooks and caller attributes

`size` (`xs`, `sm` by default, `md` or `lg`) shall size the built-in buttons and publish `data-size` on the root, so a stylesheet sizes the slider with them: the reference stylesheet grows its width, track and thumb from `xs` to `lg` and gives it the buttons' height, so it lines up with them and the value and keeps a full-height pointer target at `xs`. The control carries the hooks below, appends the caller's `className`, and forwards caller `data-*` attributes and `id` to its root.

Implementation: `src/components/zoom-control/zoom-control.tsx`, `labs/reference/zoom-control.css`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

### UIC-ZOOM-CONTROL-1.10 - Preset menu

With non-empty `presets`, the control shall render a [Dropdown Menu](DROPDOWN-MENU.md) icon trigger after the value and before the reset button (`ui-zoom-control__presets`, `chevron-down` glyph, named by the provider's `zoomPresets` string, sized by `size` and disabled by `isDisabled`) whose menu, labelled by the trigger and opening at its bottom end, lists the presets in the order given. A number is a percentage shown like the value (`50%`, with `formatOptions`) that requests that zoom through `onChange`; a named preset `{ id, label }`, such as fit to width, shows its `label` and calls `onPresetAction` with its `id`, for the caller to resolve. Choosing an item closes the menu and returns focus to the trigger.

Implementation: `src/components/zoom-control/zoom-control.tsx`, `src/components/zoom-control/zoom-presets.tsx`, `src/core/strings.ts`
Verification: `src/components/zoom-control/zoom-control.test.tsx`, `e2e/zoom-control.spec.ts`

## Hooks

| Hook                        | Kind      | Values                 | Description                                        |
| --------------------------- | --------- | ---------------------- | -------------------------------------------------- |
| `ui-zoom-control`           | root      |                        | The `role="group"` `<div>`.                        |
| `ui-zoom-control__zoom-out` | slot      |                        | The built-in zoom-out button (also `ui-button`).   |
| `ui-zoom-control__slider`   | slot      |                        | The `<input type="range">` over the levels.        |
| `ui-zoom-control__zoom-in`  | slot      |                        | The built-in zoom-in button (also `ui-button`).    |
| `ui-zoom-control__value`    | slot      |                        | The `<output>` showing the percentage.             |
| `ui-zoom-control__presets`  | slot      |                        | The preset menu trigger (also `ui-dropdown-menu`). |
| `ui-zoom-control__reset`    | slot      |                        | The reset button (also `ui-button`).               |
| `data-size`                 | attribute | `xs`, `sm`, `md`, `lg` | Size of the built-in buttons and the slider.       |
| `data-disabled`             | state     | `true`                 | The whole control is disabled.                     |
