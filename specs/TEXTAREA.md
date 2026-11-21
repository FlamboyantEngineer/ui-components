# Textarea

`Textarea` is a standalone native multiline input for use with a label and optional adjoining controls.

## UIC-TEXTAREA-1 - Native multiline input

### UIC-TEXTAREA-1.1 - Native props and hooks

`Textarea` shall render a textarea, expose its ref and support native labelling, dimensions, value, form, validation and keyboard props. Its default keyboard behavior inserts newlines. It adds interaction hooks without adding a label, description or error renderer.

Implementation: `src/components/textarea/textarea.tsx`
Verification: `src/components/textarea/textarea.test.tsx`, `e2e/textarea.spec.ts`

## Hooks

| Hook                 | Kind  | Values     | Description                       |
| -------------------- | ----- | ---------- | --------------------------------- |
| `ui-textarea`        | root  | `textarea` | The textarea.                     |
| `data-focused`       | state | `true`     | The textarea has focus.           |
| `data-focus-visible` | state | `true`     | Keyboard focus is visible.        |
| `data-hovered`       | state | `true`     | The pointer is over the textarea. |
| `data-disabled`      | state | `true`     | The textarea is disabled.         |
| `data-invalid`       | state | `true`     | The textarea is marked invalid.   |
