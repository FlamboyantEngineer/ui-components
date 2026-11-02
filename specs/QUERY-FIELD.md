# Query Field

`QueryField` is a one-line input for a query language that the caller supplies as a grammar: functions that split a query into tokens, complete the place at the caret and report problems. It is a [Code Editor](CODE-EDITOR.md) in single-line mode under a visible label, with a run button, so it highlights, completes and marks problems as the editor does. The library ships no language; a host brings its own.

## UIC-QUERY-FIELD-1 - Query field

### UIC-QUERY-FIELD-1.1 - Label and one-line editor

`QueryField` shall render its `label` in a `<label>` (`ui-query-field__label`) that names a single-line `CodeEditor` ([UIC-CODE-EDITOR-1.7](CODE-EDITOR.md#uic-code-editor-17---single-line)) in a `ui-query-field__editor` slot, showing `placeholder` while the query is empty.

Implementation: `src/components/query-field/query-field.tsx`
Verification: `src/components/query-field/query-field.test.tsx`, `e2e/query-field.spec.ts`

### UIC-QUERY-FIELD-1.2 - Grammar

The `grammar`'s `tokenize` shall highlight the query, its `complete` (a vocabulary or a completion source) shall offer completions at the caret, and its `diagnose(query)` shall report the query's problems, which the editor marks and lists below the query, as for a code editor. Completions are inserted only from a list on screen: after typing `reader:`, the first Tab shows the values without inserting one, the next Tab inserts the active value, and Escape hides the list until Tab or the next edit asks again ([UIC-COMPLETION-LIST-2.8](COMPLETION-LIST.md#uic-completion-list-28---seen-before-inserted)).

Implementation: `src/components/query-field/query-field.tsx`
Verification: `src/components/query-field/query-field.test.tsx`, `e2e/query-field.spec.ts`

### UIC-QUERY-FIELD-1.3 - Invalid query

While `diagnose` reports an error, the root shall publish `data-invalid`, the input is invalid, and the query cannot be submitted; warnings alone keep it valid. An Enter during a text composition, or the one that confirms an input method candidate (key code 229), belongs to the input method and submits nothing.

Implementation: `src/components/query-field/query-field.tsx`
Verification: `src/components/query-field/query-field.test.tsx`, `e2e/query-field.spec.ts`

### UIC-QUERY-FIELD-1.4 - Submitting

With `onSubmit`, Enter, when no completion list is open, and the run button (`ui-query-field__submit`, named by the provider string `runQuery`, disabled while the query is invalid) shall call `onSubmit` with the query, unless it is invalid. Enter never breaks the line.

Implementation: `src/components/query-field/query-field.tsx`
Verification: `src/components/query-field/query-field.test.tsx`, `e2e/query-field.spec.ts`

### UIC-QUERY-FIELD-1.5 - Value, read-only and disabled

`value` with `onChange` shall control the query and `defaultValue` start an uncontrolled one. `isReadOnly` keeps the query selectable but refuses edits; `isDisabled` refuses focus, edits and submitting, and publishes `data-disabled` on the root.

Implementation: `src/components/query-field/query-field.tsx`
Verification: `src/components/query-field/query-field.test.tsx`, `e2e/query-field.spec.ts`

### UIC-QUERY-FIELD-1.6 - Hooks and caller attributes

The field shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/query-field/query-field.tsx`
Verification: `src/components/query-field/query-field.test.tsx`

## Hooks

| Hook                      | Kind  | Values | Description                                          |
| ------------------------- | ----- | ------ | ---------------------------------------------------- |
| `ui-query-field`          | root  |        | The field.                                           |
| `ui-query-field__label`   | slot  |        | The visible label.                                   |
| `ui-query-field__control` | slot  |        | Holds the editor and the run button.                 |
| `ui-query-field__editor`  | slot  |        | The single-line code editor (also `ui-code-editor`). |
| `ui-query-field__submit`  | slot  |        | The run button (also `ui-button`).                   |
| `data-invalid`            | state | `true` | The grammar reports an error.                        |
| `data-disabled`           | state | `true` | The field is disabled.                               |
