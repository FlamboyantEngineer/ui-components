# Color Swatch

`ColorSwatch` shows one colour on its own, such as a legend key or a person's marker colour, on React Aria's `ColorSwatch`. It is named by its colour so assistive technology can read it. The [Color Field](COLOR-FIELD.md) draws it inside its trigger. `ColorSwatchPicker` and `ColorSwatchPickerItem` lay swatches out as a list to choose one colour from, on React Aria's `ColorSwatchPicker`.

## UIC-COLOR-SWATCH-1 - Contract

### UIC-COLOR-SWATCH-1.1 - Colour

`ColorSwatch` shall render a React Aria colour swatch (`ui-color-swatch`) filled with `color`, any CSS colour string or React Aria colour. It is an image (`role="img"`) described as a colour swatch and named by the colour's name in the locale (`dark grayish cyan blue`), or by `colorName` when given; an `aria-label` adds to the name. The fill is React Aria's inline background colour, a value the swatch draws rather than a style.

Implementation: `src/components/color-swatch/color-swatch.tsx`
Verification: `src/components/color-swatch/color-swatch.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-1.2 - Empty swatch

A swatch with no colour (nothing, `null` or empty text) shall be transparent, publish `data-empty` and be named by the provider string `noColor`, so a stylesheet can draw the empty state, such as a checkerboard.

Implementation: `src/components/color-swatch/color-swatch.tsx`, `src/core/strings.ts`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-1.3 - Sizes

`size` shall publish `data-size`: `xs`, `sm`, `md` (the default), `lg` or `xl`. The reference sheet draws 12, 16, 20, 24 and 32 pixel squares.

Implementation: `src/components/color-swatch/color-swatch.tsx`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-1.4 - Hooks and caller attributes

`ColorSwatch` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/color-swatch/color-swatch.tsx`
Verification: `src/components/color-swatch/color-swatch.test.tsx`

## UIC-COLOR-SWATCH-2 - Swatch picker

### UIC-COLOR-SWATCH-2.1 - Swatch list

`ColorSwatchPicker` shall render a React Aria colour swatch picker (`ui-color-swatch-picker`): a single-selection `listbox`, named by its `aria-label` (React Aria's `Color swatches` by default), laid out as a `grid` (the default) or a `stack` and publishing `data-layout`. Each `ColorSwatchPickerItem` is an `option` (`ui-color-swatch-picker__item`) drawing its `color` as a `ColorSwatch`, named by the colour's name in the locale or by `colorName`. The item whose colour equals the picker's `value` (or `defaultValue`) is selected (`aria-selected`, `data-selected`). A disabled item (`isDisabled`) stays listed but cannot be picked.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-swatch/color-swatch-picker.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-2.2 - Picking

The list shall take one tab stop; the arrow keys move between swatches (in two dimensions in a grid) and pass over disabled ones, and Enter, Space or a press picks the focused swatch, calling `onChange` with the React Aria colour.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-swatch/color-swatch-picker.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-2.3 - Picker hooks and caller attributes

`size` shall publish `data-size` on the picker (`md` by default) and size every swatch in it. The picker appends the caller's `className` and forwards caller `data-*` attributes and `id` to its root; an item appends its `className` and forwards its `data-*` attributes.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch-picker.test.tsx`

## Hooks

| Hook                           | Kind      | Values                       | Description                                                  |
| ------------------------------ | --------- | ---------------------------- | ------------------------------------------------------------ |
| `ui-color-swatch`              | root      |                              | The swatch (`<div>`).                                        |
| `data-size`                    | attribute | `xs`, `sm`, `md`, `lg`, `xl` | Box size; on a picker, the size of its swatches.             |
| `data-empty`                   | state     | `true`                       | No colour is set; on a picker, it has no items (React Aria). |
| `ui-color-swatch-picker`       | root      |                              | A swatch picker's `role="listbox"` list.                     |
| `ui-color-swatch-picker__item` | slot      |                              | One `role="option"` holding its swatch.                      |
| `data-layout`                  | state     | `grid`, `stack`              | On the picker: how the swatches are laid out (React Aria).   |
| `data-orientation`             | state     | `vertical`                   | On the picker: its orientation (React Aria).                 |
| `data-focused`                 | state     | `true`                       | On the picker or an item: focused (React Aria).              |
| `data-focus-visible`           | state     | `true`                       | On the picker or an item: keyboard focus (React Aria).       |
| `data-selected`                | state     | `true`                       | On an item: its colour is the picker's value (React Aria).   |
| `data-hovered`                 | state     | `true`                       | On an item: pointer over it (React Aria).                    |
| `data-pressed`                 | state     | `true`                       | On an item: pressed (React Aria).                            |
| `data-disabled`                | state     | `true`                       | On an item: cannot be picked (React Aria).                   |
| `data-selection-mode`          | state     | `single`                     | On an item: the picker's selection mode (React Aria).        |
| `data-collection`              | state     |                              | React Aria's collection marker.                              |
| `data-key`                     | state     |                              | On an item: its colour as `#RRGGBBAA` (React Aria).          |
