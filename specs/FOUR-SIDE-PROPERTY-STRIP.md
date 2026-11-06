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

The strip shall hold the sides' values when given `value` with `onChange`, or `defaultValue`: `renderSide` receives each side's `value` and an `onChange` that reports every side's value through `onChange`. `link` (`all`, `pairs`) shall draw a toggle [Button](BUTTON.md) with the `link` glyph (`ui-four-side-property-strip__link`, placed as [UIC-FOUR-SIDE-PROPERTY-STRIP-1.6](#uic-four-side-property-strip-16---link-brackets) describes) for each group of sides it links: one for all four sides (`all`), or one for each opposite pair (`pairs`), each operated on its own. The link state is the list of linked pairs, named by their axis: `vertical` (top and bottom) and `horizontal` (left and right), or `block` and `inline` for logical sides, controlled through `linked` with `onLinkedChange` or uncontrolled from `defaultLinked`, and always reported in that order. A pair's toggle is pressed while its pair is listed and adds or removes only its pair, so neither pair, either one or both can be linked; the toggle for all four sides is pressed while both pairs are listed, and lists both or neither. Each toggle is named by the provider string `linkSides` after the sides it links (`Link all sides`, `Link top and bottom`, `Link left and right`, or `Link top and bottom` and `Link start and end` for logical sides). While a group is linked, a change to one of its sides sets every side of that group (all four, or the side and its opposite), leaving the other pair's values and link state as they are, and its cells and bracket publish `data-linked`. Linking changes no value until the next edit. Each side's `onChange` builds on the edits made before the strip renders again, so several edits in one batch, such as a host command that sets two sides, keep each other; each render drops them, so the next edit builds on the value the strip then holds, and an edit a controlling owner did not accept is not carried on. Each reported value is a new object.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `src/core/strings/common.ts`, `src/core/glyphs.tsx`, `labs/reference/four-side-property-strip.css`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.6 - Link brackets

With `link`, the row shall publish `data-link` (`all` or `pairs`) and draw, after the cells, one `ui-four-side-property-strip__bracket` per group of sides a toggle links, each listing its sides in `data-sides` in cell order and holding that group's toggle: one bracket of all four sides for `all`, and for `pairs` one bracket of the first two sides and one of the last two (`top bottom` and `left right`, or `block-start block-end` and `inline-start inline-end`). The reference sheet lays the strip out as a grid of a letter and a control column per side and draws each bracket on the row below as `|----icon----|`: its ends tick up to the outer edges of its group's controls in the reading direction with rounded bends, the toggle sits at its centre, its rules are dashed while unlinked and solid in the accent colour while linked, and pairs stand further apart than the sides within them. Every toggle has the same geometry; a linked toggle shows its pressed state by the accent colour of its glyph, on no background, and keeps its focus ring. The row's unit (`px`, `rem`) is vertically centred alongside the side inputs, with its own line height matching the control height, beside the last of them even in a narrow row, so a bracket below the inputs, linked or not, never moves it; a hint still takes a line of its own. Side values are never clipped to make room for the unit.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `labs/reference/four-side-property-strip.css`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.7 - Value alignment

`valueAlign` (`start`, `center`, `end`) shall publish `data-value-align` on the row, so a stylesheet places each side control's value at the start, centre or end of its box in the reading direction; without it the row publishes nothing and the controls keep their own alignment. It changes no value, edit, link or caret. The reference sheet aligns the text of every input in the side cells, leaving the letters, the unit, the brackets and the inputs' boxes where they are, so negative, decimal and long values in narrow controls show whole in both directions.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `labs/reference/four-side-property-strip.css`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

### UIC-FOUR-SIDE-PROPERTY-STRIP-1.8 - Errors

`errors` shall take a message for each side whose value is wrong. The strip shall draw, after the cells and brackets, one `ui-four-side-property-strip__error` region that stays in the document while empty, as a polite atomic live region, and holds one `ui-four-side-property-strip__message` per distinct message in cell order, listing the sides it is for in `data-sides`: sides whose message is the same text share one line, and an empty message counts as none. A side with a message publishes `data-invalid` on its cell, the row publishes `data-invalid` while any side has one, and `renderSide` receives `isInvalid` and the region's id as `errorId` (undefined while the side has no message), so the side's control can set `aria-invalid` and `aria-describedby`. The reference sheet places the region on a row of its own below the controls and their brackets, spanning all four sides, in the danger colour, each message in the direction of its own text, wrapping within the strip's width instead of widening it, and takes no room while it is empty; a wrong side's input takes the danger border.

Implementation: `src/components/four-side-property-strip/four-side-property-strip.tsx`, `labs/reference/four-side-property-strip.css`
Verification: `src/components/four-side-property-strip/four-side-property-strip.test.tsx`, `e2e/four-side-property-strip.spec.ts`

## Hooks

| Hook                                   | Kind      | Values                                                                                     | Description                                                        |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `ui-four-side-property-strip`          | root      |                                                                                            | The row (also `ui-property-row`).                                  |
| `ui-four-side-property-strip__side`    | slot      |                                                                                            | One side's cell (also `ui-property-strip-cell`).                   |
| `ui-four-side-property-strip__bracket` | slot      |                                                                                            | A group of sides one edit sets together, below the cells.          |
| `ui-four-side-property-strip__link`    | slot      |                                                                                            | A group's link toggle (also `ui-button`).                          |
| `ui-four-side-property-strip__error`   | slot      |                                                                                            | The messages for wrong sides, across the strip below the controls. |
| `ui-four-side-property-strip__message` | slot      |                                                                                            | One message, for the sides in its `data-sides`.                    |
| `data-side`                            | attribute | `top`, `bottom`, `left`, `right`, `block-start`, `block-end`, `inline-start`, `inline-end` | On a cell: the side it edits.                                      |
| `data-sides`                           | attribute | Side names, space-separated                                                                | On a bracket or a message: the sides it groups, in cell order.     |
| `data-link`                            | attribute | `all`, `pairs`                                                                             | On the row: what linked sides share.                               |
| `data-value-align`                     | attribute | `start`, `center`, `end`                                                                   | On the row: where the side controls' values sit.                   |
| `data-linked`                          | state     | `true`                                                                                     | On a cell or a bracket: its group of sides is linked.              |
| `data-invalid`                         | state     | `true`                                                                                     | On a cell: its side has a message. On the row: some side has one.  |
