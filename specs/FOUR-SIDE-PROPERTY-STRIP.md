# Four Side Property Strip

`FourSidePropertyStrip` is one [Property Panel](PROPERTY-PANEL.md) row holding a value for each side of a box, such as margins or padding. The caller draws each side's control; the strip names the sides and keeps their order.

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

## Hooks

| Hook                                | Kind      | Values                           | Description                                      |
| ----------------------------------- | --------- | -------------------------------- | ------------------------------------------------ |
| `ui-four-side-property-strip`       | root      |                                  | The row (also `ui-property-row`).                |
| `ui-four-side-property-strip__side` | slot      |                                  | One side's cell (also `ui-property-strip-cell`). |
| `data-side`                         | attribute | `top`, `bottom`, `left`, `right` | On a cell: the side it edits.                    |
