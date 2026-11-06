# Expression Field

`ExpressionField` edits authored expression or decimal text, such as `2 * width + 1` or `9007199254740993.0000000000000001`, as the string the reader typed. It is a `Field` ([FIELD.md](FIELD.md)) around a single-line [Code Editor](CODE-EDITOR.md#uic-code-editor-17---single-line) surface, with the field's label, validation, dirty state, previous value, restore, undo and menu. The host owns parsing, units and constants, reference resolution and evaluation: it passes tokenization, completions and diagnostics, and its evaluation comes back as `result`. The field never evaluates the source, and never converts it through `Number` or `parseFloat`.

## UIC-EXPRESSION-FIELD-1 - Source

### UIC-EXPRESSION-FIELD-1.1 - Structure

`ExpressionField` shall render a `Field` whose root also carries `ui-expression-field`, and whose control is a single-line `CodeEditor` surface (`ui-expression-field__editor`) named by the field's label and described by its description, message and result. `placeholder` shows while the source is empty. The optional `unit` text (`ui-expression-field__unit`) and the host's `actions` (`ui-expression-field__actions`) follow the source.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`, `e2e/expression-field.spec.ts`

### UIC-EXPRESSION-FIELD-1.2 - Lossless text

The value shall be the source string exactly as typed, pasted or passed in: `1e-100`, `0.10`, `-0` and literals with more significant digits than a JavaScript number holds come back unchanged through `onChange`, `onCommit`, form values and the previous value. The field never rounds, normalizes or reformats the source; as in every single-line editor, a pasted line break becomes a space.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`, `e2e/expression-field.spec.ts`

### UIC-EXPRESSION-FIELD-1.3 - Draft, commit and revert

The source shall follow the field's value contract (`value`/`defaultValue`/`committedValue` with `onChange` and `onCommit`, UIC-FIELD-1). Enter, when no completion list is open, and focus leaving the field commit the draft; Escape on a changed source restores the committed source and goes no further, so a dialog around the field stays open. Keys that confirm an input method candidate belong to the input method and neither commit nor restore. A new controlled `value` or `committedValue` replaces the source and its baseline as for every field. `isReadOnly` keeps the source selectable but refuses edits and commits; `isDisabled` refuses focus too.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`, `e2e/expression-field.spec.ts`

### UIC-EXPRESSION-FIELD-1.4 - Host language

`tokenize`, `completions` and `diagnostics` shall pass to the editor, which highlights tokens, completes at the caret and marks problems as a code editor does ([CODE-EDITOR.md](CODE-EDITOR.md)). Diagnostics mark the source only; the field's validity comes from its own `validate` and external errors.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`

## UIC-EXPRESSION-FIELD-2 - Result

### UIC-EXPRESSION-FIELD-2.1 - Result states

`result` shall show the host's evaluation after the source in `ui-expression-field__result`, which describes the editor and publishes `data-status`: `ready` shows the host's `value` text as given, `pending` the provider string `expressionPending`, `invalid` the host's `message`, and `unavailable` the host's `message` or the provider string `expressionUnavailable`. The text sits in `ui-expression-field__result-value` after the visually hidden provider string `expressionResult`. Without `result`, nothing is drawn and the root publishes no `data-status`; with one, the root publishes the same `data-status`.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`, `e2e/expression-field.spec.ts`

### UIC-EXPRESSION-FIELD-2.2 - Stale results

Every result except `unavailable` shall name the `source` it was evaluated from. While that differs from the source the field shows, the result and the root publish `data-stale="true"` and the result's description adds the provider string `expressionStale`, so a late answer for older source never reads as the current one. A result that arrives while the reader edits never changes the source, the caret or the selection.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`, `e2e/expression-field.spec.ts`

### UIC-EXPRESSION-FIELD-2.3 - Hooks and caller attributes

The field shall carry the hooks below on top of the field's own, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root. Each field holds its own source and result, so several fields on a page are independent.

Implementation: `src/components/expression-field/expression-field.tsx`
Verification: `src/components/expression-field/expression-field.test.tsx`

## Hooks

| Hook                                | Kind      | Values                                       | Description                                                 |
| ----------------------------------- | --------- | -------------------------------------------- | ----------------------------------------------------------- |
| `ui-expression-field`               | root      |                                              | The field (also `ui-field`).                                |
| `ui-expression-field__editor`       | slot      |                                              | The single-line source editor (also `ui-code-editor`).      |
| `ui-expression-field__unit`         | slot      |                                              | The unit text after the source.                             |
| `ui-expression-field__actions`      | slot      |                                              | The host's controls after the source.                       |
| `ui-expression-field__result`       | slot      |                                              | The host's result, which describes the editor.              |
| `ui-expression-field__result-value` | slot      |                                              | The result's visible text.                                  |
| `data-status`                       | attribute | `ready`, `pending`, `invalid`, `unavailable` | On the root and the result: the result's state.             |
| `data-stale`                        | state     | `true`                                       | On the root and the result: the result is for older source. |
