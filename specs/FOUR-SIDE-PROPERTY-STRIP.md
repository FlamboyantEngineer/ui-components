# Four Side Property Strip

`FourSidePropertyStrip` is one [Property Panel](PROPERTY-PANEL.md) row holding a value for each side of a box, such as margins or padding. The caller draws each side's control; the strip names the sides and keeps their order, can name them in flow-relative terms, and, holding the values, can link the sides so one edit sets several.

## UIC-FOUR-SIDE-PROPERTY-STRIP-1 - Contract

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.1 - Sides

`FourSidePropertyStrip` shall render a `PropertyRow` holding a `PropertyStrip` of four cells, `top`, `bottom`, `left` and `right` in that order, each holding the control `renderSide` draws for its side. Each cell carries `ui-four-side-property-strip__side` and `data-side`, and its letter is the first letter of the side's name from the provider string `boxSide`, decorative with the name as its tooltip, so each control names itself.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `src/core/strings.ts`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.2 - Row options and filtering

The strip shall pass `label`, `unit`, `hint`, `description`, `actions`, `isOverridden`, `isRequired` and `wide` to its row, and give the row the four side names as keywords, so a query for a side's name keeps the row.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.3 - Hooks and caller attributes

The row's root shall carry `ui-four-side-property-strip` beside the row's hooks, append the caller's `className`, and forward `id` and caller `data-*` attributes.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.4 - Logical sides

`sides="logical"` shall draw the cells `block-start`, `block-end`, `inline-start` and `inline-end` in that order, named by the provider string `logicalBoxSide` (Top, Bottom, Start and End by default) and published in `data-side`, and hand those sides to `renderSide`. Inline start and end follow the writing direction: right to left, the start cell edits the right side. `physical` (the default) keeps top, bottom, left and right.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `src/core/strings/common.ts`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 - Values and linked sides

The strip shall hold the sides' values when given `value` with `onChange`, or `defaultValue`: `renderSide` receives each side's `value` and an `onChange` that reports every side's value through `onChange`. `link` (`all`, `pairs`) shall draw a toggle [Button](BUTTON.md) with the `link` glyph after the cells (`ui-four-side-property-strip__link`), named by the provider string `linkSides`, pressed while the sides are linked (`isLinked` with `onLinkedChange`, or `defaultLinked`). While linked, a side's change also sets every other side (`all`) or the opposite side (`pairs`: top with bottom, left with right, or each axis's start with its end), and the row publishes `data-linked`. Linking changes no value until the next edit. Each side's `onChange` builds on the edits made before the strip renders again, so several edits in one batch, such as a host command that sets two sides, keep each other; each render drops them, so the next edit builds on the value the strip then holds, and an edit a controlling owner did not accept is not carried on. Each reported value is a new object.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `src/core/strings/common.ts`, `src/core/glyphs.tsx`, `labs/reference/four-side-property-strip.css`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

## Hooks

| Hook                                | Kind      | Values                                                                                     | Description                                         |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `ui-four-side-property-strip`       | root      |                                                                                            | The row (also `ui-property-row`).                   |
| `ui-four-side-property-strip__side` | slot      |                                                                                            | One side's cell (also `ui-property-strip-cell`).    |
| `ui-four-side-property-strip__link` | slot      |                                                                                            | The toggle that links the sides (also `ui-button`). |
| `data-side`                         | attribute | `top`, `bottom`, `left`, `right`, `block-start`, `block-end`, `inline-start`, `inline-end` | On a cell: the side it edits.                       |
| `data-linked`                       | state     | `true`                                                                                     | The sides are linked.                               |
