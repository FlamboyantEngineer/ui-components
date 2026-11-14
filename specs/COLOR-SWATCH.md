# Color Swatch

`ColorSwatch` shows one color on its own, such as a legend key or a person's marker color, on React Aria's `ColorSwatch`. It is named by its color so assistive technology can read it. The [Color Field](COLOR-FIELD.md) draws it inside its trigger. `ColorSwatchPicker` and `ColorSwatchPickerItem` lay swatches out as a list to choose one color from, on React Aria's `ColorSwatchPicker`. `ColorSwatchButton` is an icon [Button](BUTTON.md) whose glyph sits over a bar of the color it applies, for text and fill color commands.

## UIC-COLOR-SWATCH-1 - Contract

### UIC-COLOR-SWATCH-1.1 - Color

`ColorSwatch` shall render a React Aria color swatch (`ui-color-swatch`) filled with `color`, a color string React Aria reads: hex with or without alpha (`#336699`, `#369`, `#33669980`), or comma-separated `rgb()`/`rgba()`, `hsl()`/`hsla()` or `hsb()`/`hsba()` (`rgb(51, 102, 153)`, `hsl(210, 50%, 40%)`). It is an image (`role="img"`) described as a color swatch and named by the color's name in the locale (`dark grayish cyan blue`), or by `colorName` when given; an `aria-label` adds to the name. The fill is React Aria's inline background color, a value the swatch draws rather than a style. The swatch also publishes the fill as `--ui-color-swatch-color` (as React Aria writes it in CSS, alpha included), so a stylesheet can layer it over a backdrop: the reference sheet draws every swatch as its color over a checkerboard, which shows through a translucent color (`#33669980`) and alone through a fully transparent one (`rgba(51, 102, 153, 0)`), while an opaque color covers it. The color composites over the board as it is, its opacity unchanged; the border, size and rounding stay the swatch's. A fully transparent color is still a color, named as one, unlike an empty swatch. The Color Field's trigger and the swatch picker's items draw their colors through `ColorSwatch` alike.

Implementation: `src/components/color-swatch/color-swatch.tsx`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-1.2 - Empty swatch

A swatch with no color (nothing, `null` or empty text), or with a color in a notation React Aria does not read (a color name such as `red`, `transparent`, `currentColor`, `oklch()`, space-separated `rgb()`), shall be transparent, publish `data-empty` and no `--ui-color-swatch-color`, and be named by the provider string `noColor`, so a stylesheet can draw the empty state, such as a checkerboard; it never throws.

Implementation: `src/components/color-swatch/color-swatch.tsx`, `src/core/strings.ts`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-1.3 - Sizes

`size` shall publish `data-size`: `xs`, `sm`, `md` (the default), `lg` or `xl`. The reference sheet draws 12, 16, 20, 24 and 32 pixel squares.

Implementation: `src/components/color-swatch/color-swatch.tsx`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-1.4 - Hooks and caller attributes

`ColorSwatch` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes, `id` and `ref` to its `<div>` root.

Implementation: `src/components/color-swatch/color-swatch.tsx`
Verification: `src/components/color-swatch/color-swatch.test.tsx`

## UIC-COLOR-SWATCH-2 - Swatch picker

### UIC-COLOR-SWATCH-2.1 - Swatch list

`ColorSwatchPicker` shall render a React Aria single-selection `listbox` (`ui-color-swatch-picker`), named by its `aria-label` (the provider's `colorSwatches` string, `Color swatches`, without `aria-label` or `aria-labelledby`), laid out as a `grid` (the default) or a `stack` and publishing `data-layout`. Each `ColorSwatchPickerItem` is an `option` (`ui-color-swatch-picker__item`) drawing its `color` as a `ColorSwatch`, named by the color's name in the locale or by `colorName`. The item whose color equals the picker's `value` (or `defaultValue`), a CSS color string compared as a color whatever its spelling, is selected (`aria-selected`, `data-selected`). A disabled item (`isDisabled`) stays listed but cannot be picked. An item whose `color` React Aria does not read ([UIC-COLOR-SWATCH-1.2](#uic-color-swatch-12---empty-swatch)) is left out, and a `value` or `defaultValue` it does not read counts as no value ([UIC-COLOR-SWATCH-2.4](#uic-color-swatch-24---no-value)), instead of throwing. Inside a React Aria color picker, such as the [Color Field](COLOR-FIELD.md)'s, the list follows and sets that picker's color.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-swatch/color-swatch-picker.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-2.2 - Picking

The list shall take one tab stop; the arrow keys move between swatches (in two dimensions in a grid) and pass over disabled ones, and Enter, Space or a press picks the focused swatch, calling `onChange` with that item's `color` string exactly as the item gives it.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-swatch/color-swatch-picker.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-2.3 - Picker hooks and caller attributes

`size` shall publish `data-size` on the picker (`md` by default) and size every swatch in it. The picker appends the caller's `className` and forwards caller `data-*` attributes and `id` to its root; an item appends its `className` and forwards its `data-*` attributes.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch-picker.test.tsx`

### UIC-COLOR-SWATCH-2.4 - No value

A controlled `value` that is empty or unreadable shall pick nothing, and the list stays controlled: a press reports the item through `onChange` and the list keeps showing `value`. Without `value` the list holds its own pick, starting at `defaultValue`, or at nothing without one; a later `defaultValue` changes nothing.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-swatch/color-swatch-picker-values.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-2.5 - Equal colors

Items shall be options in their own right whatever their color: equal colors, in the same spelling or another (`#ff0000`, `rgb(255, 0, 0)`, `hsl(0, 100%, 50%)`), are separate options that never collide. Every item of the picked color is selected together, disabled ones included, and picking one reports that item's own `color` string, also after items are added, removed or reordered.

Implementation: `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-swatch/color-swatch-picker-values.test.tsx`, `e2e/color-swatch.spec.ts`

## UIC-COLOR-SWATCH-3 - Color button

### UIC-COLOR-SWATCH-3.1 - Glyph over a color bar

`ColorSwatchButton` shall render an icon-only [Button](BUTTON.md) (`ui-button`, also `ui-color-swatch-button`), named by its `label`, whose icon holds its `icon` glyph followed by a `ColorSwatch` of `color` (`ui-color-swatch-button__swatch`), so a stylesheet can draw the swatch as a bar under the glyph. The [`font-color` and `background-color` glyphs](PROVIDER.md#uic-provider-21---built-in-glyphs) leave room for that bar at the bottom of the box; the reference sheet draws it there, across the whole width of the box and that band's height (at least 3px), so the color reads clearly without the button growing. The swatch follows [UIC-COLOR-SWATCH-1.1](#uic-color-swatch-11---color) and [UIC-COLOR-SWATCH-1.2](#uic-color-swatch-12---empty-swatch): an empty or unreadable `color` draws an empty bar (`data-empty`). The swatch's name (the color's name in the locale, `colorName`, or the provider's `noColor` string) is the button's accessible description, so a reader hears the command and the color it applies (`Text color, button, vibrant red`).

Implementation: `src/components/color-swatch/color-swatch-button.tsx`, `labs/reference/color-swatch.css`
Verification: `src/components/color-swatch/color-swatch-button.test.tsx`, `e2e/color-swatch.spec.ts`

### UIC-COLOR-SWATCH-3.2 - Button behaviour

`variant` (`ghost` by default, as for an icon button), `size`, `isDisabled`, `onPress`, `tooltip` and `shortcut` shall pass to the Button and behave as they do there; a disabled button refuses presses. The button appends the caller's `className` and forwards caller `data-*` attributes, `id` and `ref` to the Button's root. A host opens a palette from it by placing it in a menu or dialog trigger, as any Button.

Implementation: `src/components/color-swatch/color-swatch-button.tsx`
Verification: `src/components/color-swatch/color-swatch-button.test.tsx`

## Hooks

| Hook                             | Kind      | Values                       | Description                                                 |
| -------------------------------- | --------- | ---------------------------- | ----------------------------------------------------------- |
| `ui-color-swatch`                | root      |                              | The swatch (`<div>`).                                       |
| `data-size`                      | attribute | `xs`, `sm`, `md`, `lg`, `xl` | Box size; on a picker, the size of its swatches.            |
| `data-empty`                     | state     | `true`                       | No color is set; on a picker, it has no items (React Aria). |
| `--ui-color-swatch-color`        | property  |                              | On a swatch with a color: the color it draws, in CSS.       |
| `ui-color-swatch-picker`         | root      |                              | A swatch picker's `role="listbox"` list.                    |
| `ui-color-swatch-picker__item`   | slot      |                              | One `role="option"` holding its swatch.                     |
| `data-layout`                    | state     | `grid`, `stack`              | On the picker: how the swatches are laid out (React Aria).  |
| `data-orientation`               | state     | `vertical`                   | On the picker: its orientation (React Aria).                |
| `data-focused`                   | state     | `true`                       | On the picker or an item: focused (React Aria).             |
| `data-focus-visible`             | state     | `true`                       | On the picker or an item: keyboard focus (React Aria).      |
| `data-selected`                  | state     | `true`                       | On an item: its color is the picker's value (React Aria).   |
| `data-hovered`                   | state     | `true`                       | On an item: pointer over it (React Aria).                   |
| `data-pressed`                   | state     | `true`                       | On an item: pressed (React Aria).                           |
| `data-disabled`                  | state     | `true`                       | On an item: cannot be picked (React Aria).                  |
| `data-selection-mode`            | state     | `single`                     | On an item: the picker's selection mode (React Aria).       |
| `data-collection`                | state     |                              | React Aria's collection marker.                             |
| `data-key`                       | state     |                              | On an item: its color as `#RRGGBBAA` (React Aria).          |
| `ui-color-swatch-button`         | root      |                              | A color button (also `ui-button`, whose hooks it carries).  |
| `ui-color-swatch-button__swatch` | slot      |                              | The button's color bar (also `ui-color-swatch`).            |
