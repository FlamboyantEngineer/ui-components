# Color Swatch

`ColorSwatch` shows one colour on its own, such as a legend key or a person's marker colour, on React Aria's `ColorSwatch`. It is named by its colour so assistive technology can read it. The [Color Field](COLOR-FIELD.md) draws it inside its trigger.

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

## Hooks

| Hook              | Kind      | Values                       | Description           |
| ----------------- | --------- | ---------------------------- | --------------------- |
| `ui-color-swatch` | root      |                              | The swatch (`<div>`). |
| `data-size`       | attribute | `xs`, `sm`, `md`, `lg`, `xl` | Box size.             |
| `data-empty`      | state     | `true`                       | No colour is set.     |
