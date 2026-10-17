# Button

`Button` is a labelled command button built on React Aria's `Button`. Its `variant` chooses emphasis and chrome, `size` its block size, and its states are React Aria's plus `data-selected`. An icon-only command is an [Icon Button](ICON-BUTTON.md); an action that runs asynchronous work is an [Action Button](ACTION-BUTTON.md).

## UIC-BUTTON-1 - Contract

### UIC-BUTTON-1.1 - Element and press handling

`Button` shall render a native `<button>` of type `button` unless `type` asks for `submit` or `reset`. It shall report activation through `onPress` for pointer, keyboard (Enter and Space) and virtual clicks, and work as the trigger of React Aria overlays (menu, dialog, popover and tooltip triggers). Its accessible name is its label, or `aria-label`; `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-current` and `aria-describedby` pass through.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.2 - Variants

`variant` shall publish `data-variant`: `secondary` (the default, a neutral command), `primary` (the one action a surface is for), `tertiary` (low emphasis), `danger` (destructive), `ghost` (no resting fill, for dense rows and toolbars), `accent` (a highlighted creation action), `chip` (a compact bordered token among many), `link` (reads as a link in running text) or `bare` (no chrome; the host surface styles it).

Implementation: `src/components/button/button.tsx`, `labs/reference.css`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.3 - Sizes

`size` shall publish `data-size`: `xs`, `sm`, `md` (the default) or `lg`. The reference sheet draws 22, 26, 32 and 38 pixel blocks.

Implementation: `src/components/button/button.tsx`, `labs/reference.css`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.4 - Content and alignment

By default (`content="label"`) the children shall sit in one `ui-button__label` slot. With `content="parts"` they sit directly in the button so the caller lays out its own parts; with `content="sentence"` a prose label may wrap. `content`, `align` (`center` by default, or `start` for scannable rows) and `fullWidth` publish `data-content`, `data-align` and `data-full-width`.

Implementation: `src/components/button/button.tsx`, `labs/reference.css`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-1.5 - Icons

`startIcon` and `endIcon` shall draw a built-in glyph name or any icon node as a decorative [Icon](ICON.md) in the `ui-button__start-icon` and `ui-button__end-icon` slots, before and after the label.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

## UIC-BUTTON-2 - States

### UIC-BUTTON-2.1 - Disabled

`isDisabled` shall set the native `disabled` attribute and `data-disabled`. With `focusableWhenDisabled` the button stays in the focus order with `aria-disabled="true"` and `data-disabled`, refuses activation by pointer, Enter and Space, and never submits a form.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-2.2 - Pending

`isPending` shall keep the button focusable but refuse presses, set `aria-disabled="true"` and `data-pending`, draw an indeterminate progress bar in the `ui-button__spinner` slot in place of the icons, named by `pendingLabel` or the provider's `loading` string, keep the visible label and accessible name, and never submit a form. React Aria announces the change to and from pending while the button has focus.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-2.3 - Selected and toggle state

`isSelected` shall mark the button as the current choice with `data-selected` and, unless the caller states toggle semantics itself through `aria-pressed`, `aria-checked` or a `role`, with `aria-pressed="true"`. A caller's `aria-pressed` (`true`, `false` or `mixed`) passes through unchanged.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-2.4 - Interaction states

The button shall publish React Aria's interaction states: `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-2.5 - Hooks and caller attributes

`Button` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `ref` to the `<button>`, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

## Hooks

| Hook                    | Kind      | Values                                                                                  | Description                          |
| ----------------------- | --------- | --------------------------------------------------------------------------------------- | ------------------------------------ |
| `ui-button`             | root      |                                                                                         | The `<button>`.                      |
| `ui-button__label`      | slot      |                                                                                         | The label, unless `content="parts"`. |
| `ui-button__start-icon` | slot      |                                                                                         | Leading icon (also `ui-icon`).       |
| `ui-button__end-icon`   | slot      |                                                                                         | Trailing icon (also `ui-icon`).      |
| `ui-button__spinner`    | slot      |                                                                                         | Busy indicator while pending.        |
| `data-variant`          | attribute | `primary`, `secondary`, `tertiary`, `danger`, `ghost`, `accent`, `chip`, `link`, `bare` | Emphasis and chrome.                 |
| `data-size`             | attribute | `xs`, `sm`, `md`, `lg`                                                                  | Block size.                          |
| `data-content`          | attribute | `label`, `parts`, `sentence`                                                            | How children are laid out.           |
| `data-align`            | attribute | `center`, `start`                                                                       | Content alignment.                   |
| `data-full-width`       | state     | `true`                                                                                  | Fills the container's width.         |
| `data-selected`         | state     | `true`                                                                                  | The current choice.                  |
| `data-disabled`         | state     | `true`                                                                                  | Disabled (also when focusable).      |
| `data-pending`          | state     | `true`                                                                                  | Pending; presses are refused.        |
| `data-hovered`          | state     | `true`                                                                                  | Pointer over the button.             |
| `data-pressed`          | state     | `true`                                                                                  | Being pressed.                       |
| `data-focused`          | state     | `true`                                                                                  | Focused.                             |
| `data-focus-visible`    | state     | `true`                                                                                  | Keyboard focus.                      |
