# Formula Bar

`FormulaBar` sits above a spreadsheet grid, such as a [Table](TABLE.md#uic-table-14---spreadsheet-mode) in spreadsheet mode: a reference box shows the active cell's A1-style reference and moves to the cell the reader types, and a one-line [Code Editor](CODE-EDITOR.md) shows the cell's raw content, such as a formula, highlighted by the caller's tokenizer. Enter commits the content and Escape restores it. The library has no formula engine: the caller stores the content, evaluates it and may show the result beside the input. The pure helpers `formatCellReference` and `parseCellReference` convert between cells and references.

## UIC-FORMULA-BAR-1 - Cell references

### UIC-FORMULA-BAR-1.1 - Formatting a reference

`formatCellReference({ row, column })` shall return the A1-style reference of a cell given by zero-based indices: the column in letters (`A` to `Z`, then `AA` to `ZZ`, then `AAA`), followed by the one-based row number, so row 11, column 2 is `C12`.

Implementation: `src/utils/cell-reference.ts`
Verification: `src/utils/cell-reference.test.ts`

### UIC-FORMULA-BAR-1.2 - Reading a reference

`parseCellReference(text)` shall return the zero-based `{ row, column }` an A1-style reference names, ignoring letter case, surrounding spaces and the `$` marks of an absolute reference (`$B$3`), and null for any other text: an empty text, a range, a row number of 0 or with a leading zero, or letters outside A to Z. It reads every reference `formatCellReference` writes back to its cell.

Implementation: `src/utils/cell-reference.ts`
Verification: `src/utils/cell-reference.test.ts`

## UIC-FORMULA-BAR-2 - Reference box

### UIC-FORMULA-BAR-2.1 - The active cell's reference

The bar shall start with the reference box (`ui-formula-bar__reference`), an input named by the provider's `formulaCellReference` string that shows `formatCellReference(cell)` for the active `cell`, or nothing while `cell` is null, and selects its text when it takes focus.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

### UIC-FORMULA-BAR-2.2 - Moving to a typed reference

Enter in the reference box shall read the typed text with `parseCellReference` and, when it names a cell inside `rowCount` rows and `columnCount` columns (where given), call `onCellChange(cell)` and show the active cell's reference again. Otherwise the box keeps the text, publishes `data-invalid` and `aria-invalid`, and a visually hidden status (`ui-formula-bar__status`) reads the provider's `formulaInvalidReference` with the text, until the reader types again. Escape, or leaving the box, drops the typed text and shows the active cell's reference. Escape is the box's (marked handled, so an overlay around the bar stays open) only when there is typed text or a refused reference to drop; otherwise, and while an input method composes, it goes on to the surface around the bar. A new active cell also drops the typed text and a refused reference, and returning to the earlier cell does not bring them back. After Enter or Escape the box selects the text it then shows, so typing replaces it. Enter in the reference box is always the box's (marked handled, never submitting an enclosing form), whether the text is unchanged, moves to a cell or is refused, except the Enter that confirms a text composition (`isComposing`, or key code 229), which goes on to the input method.

Implementation: `src/components/formula-bar/formula-bar.tsx`, `src/utils/cell-reference.ts`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

## UIC-FORMULA-BAR-3 - Content

### UIC-FORMULA-BAR-3.1 - One-line content editor

After the cancel and confirm buttons and the fₓ mark (the `formula` glyph: decorative as `ui-formula-bar__glyph`, or the function button of UIC-FORMULA-BAR-3.5), the bar shall draw a single-line `CodeEditor` (`ui-formula-bar__editor`, `multiline={false}`) named by the provider's `formulaCellContent` string, holding `value`, the active cell's raw content, with the caller's `tokenize`, `completions` and `placeholder`. Edits stay in a draft until committed; a new `cell` or `value` starts the draft over and discards the old one, so returning to an earlier cell or value, directly or through no active cell, shows its `value` again rather than the abandoned draft. Rendering again with the same cell and value keeps the draft. While the draft differs from `value` the root publishes `data-dirty`. With `isReadOnly` the content is selectable but refuses edits; with `isDisabled`, or while `cell` is null, the editor is disabled and the root publishes `data-disabled`.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

### UIC-FORMULA-BAR-3.2 - Committing and cancelling

Enter in the editor, when no completion list is open and it does not confirm a text composition (`isComposing`, or key code 229), and the `ui-formula-bar__confirm` icon button (the provider's `confirm` string, enabled while the draft differs and the bar is neither locked nor read-only) shall call `onCommit(content, cell)` with the draft and the active cell, unless the bar is read-only; the caller stores it, and the bar never changes the content itself. Escape in the editor, while the draft differs, and the `ui-formula-bar__cancel` icon button (the provider's `cancel` string, enabled while the draft differs) restore `value`. While the bar is locked (`isDisabled`, or no active `cell`) both buttons are disabled and neither commits nor cancels, by pointer or keyboard, even with focus already on one of them; the draft stays as it was and returns, still uncommitted, once the bar is enabled again. A read-only bar keeps Cancel, which drops a draft made before it turned read-only, and disables Confirm.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

### UIC-FORMULA-BAR-3.3 - Caller evaluation

With `evaluate`, the bar shall show `evaluate(content, cell)` for the draft and the active cell in `ui-formula-bar__result`, after a visually hidden label from the provider's `formulaResult` string, and describe the editor with it, updating as the reader types. The bar evaluates nothing itself.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

### UIC-FORMULA-BAR-3.4 - Without buttons

With `showActions={false}` the bar shall draw neither the cancel nor the confirm button and keep no room for them; Enter and Escape in the editor still commit and cancel as in UIC-FORMULA-BAR-3.2, with the same composition guard and the same locked, read-only and dirty rules, and the editor's description gains the provider string `formulaKeysHint` ("Enter confirms, Escape cancels."), after the result, so a reader learns the keys the missing buttons stood for. `showActions` defaults to true.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

### UIC-FORMULA-BAR-3.5 - Inserting a function

With `functions` (completions such as `{ label: 'SUM', description }`), the fₓ mark shall be an icon-only menu button (`ui-formula-bar__functions`, also `ui-dropdown-menu`) named by the provider's `formulaFunctions` string, whose menu lists each function by its label and description, operable by pointer and keyboard, closing on Escape with focus back on the button. Choosing one inserts its `insertText`, or else its `label`, followed by brackets into the draft at the editor's selection: selected text goes inside the brackets, and an empty content starts with `=`. Focus then returns to the editor with the caret after the bracketed text, and nothing is committed: the draft is dirty until Enter or Confirm. The button is disabled while the bar is locked (`isDisabled`, or no active `cell`) or read-only. Without `functions` the mark stays the decorative `ui-formula-bar__glyph`. The bar evaluates nothing, so the caller decides which functions to offer.

Implementation: `src/components/formula-bar/formula-bar.tsx`, `src/components/formula-bar/formula-bar-functions.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

## UIC-FORMULA-BAR-4 - Accessibility and hooks

### UIC-FORMULA-BAR-4.1 - Accessible bar

The root shall be a group named by `aria-label` or `aria-labelledby`, by default the provider's `formulaBar` string, taking `aria-describedby` and `aria-details`; each control has its own name, and the lab passes axe in the light and dark reference themes.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`, `e2e/formula-bar.spec.ts`

### UIC-FORMULA-BAR-4.2 - Hooks and caller attributes

`FormulaBar` shall carry the hooks below beside the code editor's and icon buttons', append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/formula-bar/formula-bar.tsx`
Verification: `src/components/formula-bar/formula-bar.test.tsx`

## Hooks

| Hook                        | Kind  | Values | Description                                                       |
| --------------------------- | ----- | ------ | ----------------------------------------------------------------- |
| `ui-formula-bar`            | root  |        | The `<div>` around the reference box, the buttons and the editor. |
| `ui-formula-bar__reference` | slot  |        | The reference box `<input>`.                                      |
| `ui-formula-bar__status`    | slot  |        | The visually hidden status that reads a refused reference.        |
| `ui-formula-bar__cancel`    | slot  |        | The button that restores the content (also `ui-button`).          |
| `ui-formula-bar__confirm`   | slot  |        | The button that commits the content (also `ui-button`).           |
| `ui-formula-bar__glyph`     | slot  |        | The decorative fₓ glyph, without `functions`.                     |
| `ui-formula-bar__functions` | slot  |        | The fₓ button listing `functions` (also `ui-dropdown-menu`).      |
| `ui-formula-bar__editor`    | slot  |        | The single-line code editor (also `ui-code-editor`).              |
| `ui-formula-bar__result`    | slot  |        | The caller's evaluation of the content.                           |
| `data-dirty`                | state | `true` | On the root while the content differs from the cell's.            |
| `data-disabled`             | state | `true` | On the root while disabled or no cell is active.                  |
| `data-invalid`              | state | `true` | On the reference box while it holds a refused reference.          |
| `data-focused`              | state | `true` | On the reference box while it has focus (React Aria).             |
| `data-focus-visible`        | state | `true` | On the reference box while it has keyboard focus (React Aria).    |
| `data-hovered`              | state | `true` | On the reference box while the pointer is over it (React Aria).   |
