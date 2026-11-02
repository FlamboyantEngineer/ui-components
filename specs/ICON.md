# Icon

`Icon` draws one icon in a square box: an imported icon component or children supplied by the caller.

## UIC-ICON-1 - Contract

### UIC-ICON-1.1 - Sources

`Icon` shall draw its `icon` component, or without `icon`, its children (an SVG element, image or any node). Imported components render in the `ui-icon__glyph` slot. Components that take an `IconSource` accept an imported component or rendered element, with `null`, `undefined` and `false` representing no icon. `toIconProps` passes components as `icon` and elements as `children`; custom text is wrapped in an element. Individually exported built-in components such as `CloseGlyph` honor provider overrides; third-party components work directly. Importing one glyph shall not retain unused built-in icons.

Implementation: `src/components/icon/icon.tsx`
Verification: `src/components/icon/icon.test.tsx`, `test/bundle.test.ts`, `e2e/icon.spec.ts`

### UIC-ICON-1.2 - Sizes

`Icon` shall publish its box size in `data-size`: `sm`, `md` (the default), `lg` or `inherit` ([UIC-ICON-1.5](#uic-icon-15---inherited-size)). The host stylesheet maps each size to a box; the reference sheet uses 12, 16 and 20 pixels. A glyph or child fills the box.

Implementation: `src/components/icon/icon.tsx`, `labs/reference/icon.css`
Verification: `src/components/icon/icon.test.tsx`, `e2e/icon.spec.ts`

### UIC-ICON-1.3 - Accessibility

An icon without `label` shall be decorative: `aria-hidden="true"` and no role. With `label` it shall render `role="img"` named by the label. Glyphs inside are always hidden, so the name is announced once.

Implementation: `src/components/icon/icon.tsx`
Verification: `src/components/icon/icon.test.tsx`, `e2e/icon.spec.ts`

### UIC-ICON-1.4 - Hooks and caller attributes

`Icon` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `ref` to its `<span>` root, and publish the built-in component's `glyphName` in `data-glyph` when present.

Implementation: `src/components/icon/icon.tsx`
Verification: `src/components/icon/icon.test.tsx`

### UIC-ICON-1.5 - Inherited size

`size="inherit"` shall publish `data-size="inherit"`, a box as tall and wide as the surrounding font size (1em in the reference sheet), so the icon scales with the text it sits in instead of taking a fixed box.

Implementation: `src/components/icon/icon.tsx`, `labs/reference/icon.css`
Verification: `src/components/icon/icon.test.tsx`, `e2e/icon.spec.ts`

## Hooks

| Hook             | Kind      | Values                      | Description                                         |
| ---------------- | --------- | --------------------------- | --------------------------------------------------- |
| `ui-icon`        | root      |                             | The icon box (`<span>`).                            |
| `ui-icon__glyph` | slot      |                             | The imported component's SVG, when `icon` is set.   |
| `data-size`      | attribute | `sm`, `md`, `lg`, `inherit` | Box size; `inherit` follows the font size.          |
| `data-glyph`     | attribute |                             | The built-in component’s `glyphName`, when present. |
