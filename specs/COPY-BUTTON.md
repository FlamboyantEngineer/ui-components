# Copy Button

`CopyButton` copies a value to the clipboard: an [Icon Button](ICON-BUTTON.md) that shows a check mark while the copy's outcome lasts and announces it, built on [`useClipboard`](CLIPBOARD.md#uic-clipboard-21---copied-state-with-a-timeout). A component that copies from a control of its own uses the hook directly.

## UIC-COPY-BUTTON-1 - Contract

### UIC-COPY-BUTTON-1.1 - Copying and feedback

Pressing the button by pointer or keyboard shall copy `value`, whitespace included, and call `onCopy` with whether it reached the clipboard. After a successful copy, the `ui-copy-button` root publishes `data-copied`, the button draws the `check` glyph instead of `copy`, and the `ui-copy-button__status` live region (`role="status"`, visually hidden) reads the provider's `copied` string, until `timeout` milliseconds (2000 by default) after the last copy; then all three return to rest and the live region empties. The button keeps its name throughout.

Implementation: `src/components/copy-button/copy-button.tsx`, `src/utils/use-clipboard.ts`, `labs/reference/copy-button.css`
Verification: `src/components/copy-button/copy-button.test.tsx`, `e2e/copy-button.spec.ts`

### UIC-COPY-BUTTON-1.2 - Refused copy

When the copy does not reach the clipboard, the root shall publish `data-failed`, the button draw the `error` glyph and the live region read the provider's `copyFailed` string, for the same timeout.

Implementation: `src/components/copy-button/copy-button.tsx`
Verification: `src/components/copy-button/copy-button.test.tsx`

### UIC-COPY-BUTTON-1.3 - Name and strings

The button shall be named by `label`, or by the provider's `copy` string without one.

Implementation: `src/components/copy-button/copy-button.tsx`, `src/core/strings.ts`
Verification: `src/components/copy-button/copy-button.test.tsx`, `e2e/copy-button.spec.ts`

### UIC-COPY-BUTTON-1.4 - Options, hooks and caller attributes

`variant`, `size` and `isDisabled` shall pass to the Icon Button, which publishes its own hooks in the `ui-copy-button__button` slot; a disabled button never copies. `CopyButton` shall carry the hooks below on its `<span>` root, append the caller's `className`, forward caller `data-*` attributes and `id` to the root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/copy-button/copy-button.tsx`
Verification: `src/components/copy-button/copy-button.test.tsx`, `e2e/copy-button.spec.ts`

## Hooks

| Hook                     | Kind  | Values | Description                                                      |
| ------------------------ | ----- | ------ | ---------------------------------------------------------------- |
| `ui-copy-button`         | root  |        | The `<span>` holding the button and its live region.             |
| `ui-copy-button__button` | slot  |        | The button (also `ui-icon-button`).                              |
| `ui-copy-button__status` | slot  |        | The visually hidden live region that announces the outcome.      |
| `data-copied`            | state | `true` | The last copy reached the clipboard and its feedback is showing. |
| `data-failed`            | state | `true` | The last copy was refused and its feedback is showing.           |
