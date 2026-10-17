# Icon

`Icon` draws one icon in a square box: a built-in glyph from the provider's glyph map, or any icon node the caller passes. Hosts keep their own icon registries and pass the drawings in as children.

## UIC-ICON-1 - Contract

### UIC-ICON-1.1 - Sources

`Icon` shall draw the built-in glyph named by `glyph` (through the provider, [PROVIDER.md](PROVIDER.md)) or, without `glyph`, its children (an SVG element, an image or any node). A glyph renders in the `ui-icon__glyph` slot.

Implementation: `src/components/icon/icon.tsx`
Verification: `src/components/icon/icon.test.tsx`, `e2e/icon.spec.ts`

### UIC-ICON-1.2 - Sizes

`Icon` shall publish its box size in `data-size`: `sm`, `md` (the default) or `lg`. The host stylesheet maps each size to a box; the reference sheet uses 12, 16 and 20 pixels. A glyph or child fills the box.

Implementation: `src/components/icon/icon.tsx`, `labs/reference/icon.css`
Verification: `src/components/icon/icon.test.tsx`, `e2e/icon.spec.ts`

### UIC-ICON-1.3 - Accessibility

An icon without `label` shall be decorative: `aria-hidden="true"` and no role. With `label` it shall render `role="img"` named by the label. Glyphs inside are always hidden, so the name is announced once.

Implementation: `src/components/icon/icon.tsx`
Verification: `src/components/icon/icon.test.tsx`, `e2e/icon.spec.ts`

### UIC-ICON-1.4 - Hooks and caller attributes

`Icon` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes and `id`, and publish the glyph name in `data-glyph` when it draws a glyph.

Implementation: `src/components/icon/icon.tsx`
Verification: `src/components/icon/icon.test.tsx`

## Hooks

| Hook             | Kind      | Values           | Description                                        |
| ---------------- | --------- | ---------------- | -------------------------------------------------- |
| `ui-icon`        | root      |                  | The icon box (`<span>`).                           |
| `ui-icon__glyph` | slot      |                  | The built-in glyph's `<svg>`, when `glyph` is set. |
| `data-size`      | attribute | `sm`, `md`, `lg` | Box size.                                          |
| `data-glyph`     | attribute |                  | The built-in glyph name, when `glyph` is set.      |
