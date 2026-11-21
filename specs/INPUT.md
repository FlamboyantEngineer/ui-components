# Input

`Input` is a standalone native input for use with a label and optional adjoining controls.

## UIC-INPUT-1 - Native input

### UIC-INPUT-1.1 - Native props and hooks

`Input` shall render an input, expose its ref and support native labelling, value, form, validation and keyboard props. It adds interaction hooks without adding a label, description or error renderer.

Implementation: `src/components/input/input.tsx`
Verification: `src/components/input/input.test.tsx`, `e2e/input.spec.ts`

## Hooks

| Hook                 | Kind  | Values  | Description                    |
| -------------------- | ----- | ------- | ------------------------------ |
| `ui-input`           | root  | `input` | The input.                     |
| `data-focused`       | state | `true`  | The input has focus.           |
| `data-focus-visible` | state | `true`  | Keyboard focus is visible.     |
| `data-hovered`       | state | `true`  | The pointer is over the input. |
| `data-disabled`      | state | `true`  | The input is disabled.         |
| `data-invalid`       | state | `true`  | The input is marked invalid.   |
