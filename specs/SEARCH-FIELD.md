# Search Field

`SearchField` is a search or filter box, built on React Aria's `SearchField`: a search glyph, the query input, a spinner while results load and a clear button while it holds text. The query filters or finds; it is not a stored value, so the search box has no field around it (no dirty state, undo or field menu), but it checks its query in the field vocabulary (`validate` returns [field issues](FIELD.md)) and can draw its label, a description and the field's message region around the box. A value that is stored is a [Text Field](TEXT-FIELD.md); text completed from suggestions the control shows is a [Combobox](COMBOBOX.md).

## UIC-SEARCH-FIELD-1 - Contract

### UIC-SEARCH-FIELD-1.1 - Search box

`SearchField` shall render a search box (`ui-search-field`) holding a decorative `search` glyph (`ui-search-field__glyph`) and an `<input type="search">` (`ui-search-field__input`) named by `label`. `inputRef` receives the input, so a caller can move focus to it. The query is `value` (controlled) or `defaultValue` (uncontrolled), reported through `onChange`; `name` submits it with a form; `isDisabled` and `isReadOnly` lock it. The text input props (UIC-FIELD-8.3: `placeholder`, `autoComplete`, `inputMode`, `spellCheck`, `autoFocus`) and the focus and keyboard handlers (`onFocus`, `onBlur`, `onFocusChange`, `onKeyDown`, `onKeyUp`) reach the input.

Implementation: `src/components/search-field/search-field.tsx`, `labs/reference/search-field.css`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-1.2 - Sizes

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size`: `md` for page toolbars and panels, `sm` and `xs` for dense chrome. The reference sheet draws the box at the control height of that size (UIC-LABS-3.7).

Implementation: `src/components/search-field/search-field.tsx`, `labs/reference/search-field.css`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-1.3 - Clear button

While the box holds text and is editable, it shall show a clear button (`ui-search-field__clear`) after the input: an `Button` with the `close` glyph or, with `clearText`, a `Button` showing that text, named by `clearLabel` (the provider string `clearSearch` by default) either way. The button is reached by Tab after the input. Pressing it empties the query (`onChange` with `''`, then `onClear`) and puts focus back in the input. An empty, read-only or disabled box shows no clear button.

Implementation: `src/components/search-field/search-field.tsx`, `src/core/strings.ts`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-1.4 - Keyboard

Escape in a box holding text shall empty the query and stop there; in an empty box it goes on to the enclosing surface. Enter shall call `onSubmit` with the query. Each change of the query is published once through `onChange`.

Implementation: `src/components/search-field/search-field.tsx`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-1.5 - Hooks and caller attributes

`SearchField` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes and `id` to it.

Implementation: `src/components/search-field/search-field.tsx`
Verification: `src/components/search-field/search-field.test.tsx`

## UIC-SEARCH-FIELD-2 - Label, messages and loading

### UIC-SEARCH-FIELD-2.1 - Label layout

`labelLayout` shall publish `data-label-layout`. In the `control-only` layout (the default) the root is the box, and `label` names the input through `aria-label`. In the `label-control` layout the root holds a label (`ui-search-field__label`, a `<label>` that names the input), then a group (`ui-search-field__group`, role `presentation`) around the glyph, the input, the spinner and the clear button, which the reference sheet frames as the box, then the description and the error message.

Implementation: `src/components/search-field/search-field.tsx`, `labs/reference/search-field.css`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-2.2 - Description and error message

In the `label-control` layout, `description` shall render below the box (`ui-search-field__description`) and describe the input. `validate` checks the query as a field's `validate` does (UIC-FIELD-3.1): it returns `FieldIssues`, where an `error` makes the query invalid and a `warning` only advises. The root publishes the status as `data-validation` (`valid`, `invalid` or `warning`) and, while invalid, `data-invalid` on the root, the group and the input, which is `aria-invalid`. In the `label-control` layout the first message shows in the field's message region (`ui-search-field__message`, carrying `data-severity` `error` or `warning`), a polite live region that stays in the document and describes the input after the description while it holds a message. `validationBehavior` keeps the field default, `aria`; `native` also gives an error to the input's constraint validation, so a form submit is refused while the query is invalid.

Implementation: `src/components/search-field/search-field.tsx`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-2.3 - Busy indicator

While `isPending`, the box shall publish `data-pending` on its root and show an indeterminate progress bar (`ui-search-field__spinner`, named by the provider string `loading`) after the input, before the clear button. The query stays editable.

Implementation: `src/components/search-field/search-field.tsx`, `src/components/button/button.tsx`, `labs/reference/search-field.css`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

## Hooks

| Hook                           | Kind      | Values                          | Description                                                         |
| ------------------------------ | --------- | ------------------------------- | ------------------------------------------------------------------- |
| `ui-search-field`              | root      |                                 | The search box (`<div>`).                                           |
| `ui-search-field__label`       | slot      |                                 | The visible `<label>` of the `label-control` layout.                |
| `ui-search-field__group`       | slot      |                                 | The box of the `label-control` layout.                              |
| `ui-search-field__glyph`       | slot      |                                 | The search glyph (also `ui-glyph`).                                 |
| `ui-search-field__input`       | slot      |                                 | The `<input type="search">`.                                        |
| `ui-search-field__spinner`     | slot      |                                 | The busy indicator.                                                 |
| `ui-search-field__clear`       | slot      |                                 | The clear button (also `ui-button`, or `ui-button`).                |
| `ui-search-field__description` | slot      |                                 | The description of the `label-control` layout.                      |
| `ui-search-field__message`     | slot      |                                 | The validation message region of the `label-control` layout.        |
| `data-size`                    | attribute | `xs`, `sm`, `md`, `lg`          | On the root: box size.                                              |
| `data-label-layout`            | attribute | `control-only`, `label-control` | On the root: where the label sits.                                  |
| `data-pending`                 | state     | `true`                          | On the root: results are loading.                                   |
| `data-validation`              | state     | `valid`, `invalid`, `warning`   | On the root: the query's validation status.                         |
| `data-severity`                | state     | `error`, `warning`              | On the message: the severity of the message shown.                  |
| `data-empty`                   | state     | `true`                          | On the root: the query is empty (React Aria).                       |
| `data-disabled`                | state     | `true`                          | On the root, the group and the input: disabled (React Aria).        |
| `data-readonly`                | state     | `true`                          | On the root: read-only (React Aria).                                |
| `data-invalid`                 | state     | `true`                          | On the root, the group and the input: invalid (React Aria).         |
| `data-required`                | state     | `true`                          | On the root: a query is required (React Aria).                      |
| `data-hovered`                 | state     | `true`                          | On the group and the input: under the pointer (React Aria).         |
| `data-focus-within`            | state     | `true`                          | On the group: focus is inside it (React Aria).                      |
| `data-focused`                 | state     | `true`                          | On the input: focused (React Aria).                                 |
| `data-focus-visible`           | state     | `true`                          | On the group and the input: focused from the keyboard (React Aria). |
