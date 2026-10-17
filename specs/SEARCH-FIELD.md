# Search Field

`SearchField` is a search or filter box on React Aria's `SearchField`: a search glyph, the query input and a clear button while it holds text. The query filters or finds; it is not a stored value, so the search box has no field around it (no label layout, dirty state or field menu). A value that is stored is a [Text Field](TEXT-FIELD.md); text completed from suggestions the control shows is a [Combobox](COMBOBOX.md).

## UIC-SEARCH-FIELD-1 - Contract

### UIC-SEARCH-FIELD-1.1 - Search box

`SearchField` shall render a React Aria search field (`ui-search-field`) holding a decorative `search` glyph (`ui-search-field__glyph`) and an `<input type="search">` (`ui-search-field__input`) named by `label`, with `placeholder` shown while it is empty. React Aria's search field props pass through: `value`, `defaultValue` and `onChange`, `onSubmit`, `onClear`, `name`, `autoFocus`, `isDisabled`, `isReadOnly`, `onKeyDown` and the others.

Implementation: `src/components/search-field/search-field.tsx`, `labs/reference/search-field.css`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-1.2 - Sizes

`size` shall publish `data-size`: `md` (the default) for page toolbars and panels, `sm` for dense chrome. The reference sheet draws 32 and 26 pixel boxes.

Implementation: `src/components/search-field/search-field.tsx`, `labs/reference/search-field.css`
Verification: `src/components/search-field/search-field.test.tsx`, `e2e/search-field.spec.ts`

### UIC-SEARCH-FIELD-1.3 - Clear button

While the box holds text and is editable, it shall show a clear button (`ui-search-field__clear`) after the input: an `IconButton` with the `close` glyph or, with `clearText`, a `Button` showing that text, named by `clearLabel` (the provider string `clearSearch` by default) either way. The button is reached by Tab after the input. Pressing it empties the query (`onChange` with `''`, then `onClear`) and puts focus back in the input. An empty, read-only or disabled box shows no clear button.

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

## Hooks

| Hook                     | Kind      | Values     | Description                                               |
| ------------------------ | --------- | ---------- | --------------------------------------------------------- |
| `ui-search-field`        | root      |            | The search box (`<div>`).                                 |
| `ui-search-field__glyph` | slot      |            | The search glyph (also `ui-glyph`).                       |
| `ui-search-field__input` | slot      |            | The `<input type="search">`.                              |
| `ui-search-field__clear` | slot      |            | The clear button (also `ui-icon-button`, or `ui-button`). |
| `data-size`              | attribute | `sm`, `md` | On the root: box size.                                    |
| `data-empty`             | state     | `true`     | On the root: the query is empty (React Aria).             |
| `data-disabled`          | state     | `true`     | On the root and the input: disabled (React Aria).         |
| `data-readonly`          | state     | `true`     | On the root: read-only (React Aria).                      |
| `data-invalid`           | state     | `true`     | On the root and the input: invalid (React Aria).          |
| `data-required`          | state     | `true`     | On the root: a query is required (React Aria).            |
| `data-hovered`           | state     | `true`     | On the input: under the pointer (React Aria).             |
| `data-focused`           | state     | `true`     | On the input: focused (React Aria).                       |
| `data-focus-visible`     | state     | `true`     | On the input: focused from the keyboard (React Aria).     |
