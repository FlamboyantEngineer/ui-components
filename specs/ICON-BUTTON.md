# Icon Button

`IconButton` is an icon-only command button built on React Aria's `Button`. It shares [Button](BUTTON.md)'s variants, sizes and states, and requires a label because it shows no text.

## UIC-ICON-BUTTON-1 - Contract

### UIC-ICON-BUTTON-1.1 - Icon and name

`IconButton` shall draw its `icon` (a built-in glyph name or any icon node) as a decorative [Icon](ICON.md) in the `ui-icon-button__icon` slot and name the button with its required `label` through `aria-label`. An empty label is an error.

Implementation: `src/components/icon-button/icon-button.tsx`
Verification: `src/components/icon-button/icon-button.test.tsx`, `e2e/icon-button.spec.ts`

### UIC-ICON-BUTTON-1.2 - Variants and sizes

`variant` (Button's variants, `ghost` by default) and `size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-variant` and `data-size`. The reference sheet draws square 22, 26, 32 and 38 pixel boxes.

Implementation: `src/components/icon-button/icon-button.tsx`, `labs/reference/icon-button.css`
Verification: `src/components/icon-button/icon-button.test.tsx`, `e2e/icon-button.spec.ts`

### UIC-ICON-BUTTON-1.3 - States

`IconButton` shall offer Button's states with the same semantics, through the same React Aria wiring: `isDisabled` with optional `focusableWhenDisabled`, `isPending` (an indeterminate progress bar named by `pendingLabel` replaces the icon in the `ui-icon-button__spinner` slot), `isSelected` with toggle semantics, and React Aria's interaction states.

Implementation: `src/components/icon-button/icon-button.tsx`, `src/components/button/button.tsx`
Verification: `src/components/icon-button/icon-button.test.tsx`, `e2e/icon-button.spec.ts`

### UIC-ICON-BUTTON-1.4 - Hooks and caller attributes

`IconButton` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref`.

Implementation: `src/components/icon-button/icon-button.tsx`
Verification: `src/components/icon-button/icon-button.test.tsx`

### UIC-ICON-BUTTON-1.5 - Tooltip

`tooltip` shall show its content in a [Tooltip](TOOLTIP.md) for the button with the same rules as [Button](BUTTON.md)'s `tooltip`: hover and keyboard focus open it, no wrapper element is added, and a natively disabled button shows none unless it is `focusableWhenDisabled`. The tooltip describes the button; `label` stays its accessible name.

Implementation: `src/components/icon-button/icon-button.tsx`, `src/components/tooltip/tooltip.tsx`
Verification: `src/components/icon-button/icon-button.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-ICON-BUTTON-1.6 - Keyboard shortcut

`shortcut` shall work as on [Button](BUTTON.md): `aria-keyshortcuts` and a [Shortcut](SHORTCUT.md) after the hint in the tooltip, never a listener. Because the button shows no text, a shortcut without a `tooltip` shows the `label` before the chord.

Implementation: `src/components/icon-button/icon-button.tsx`, `src/components/button/button.tsx`
Verification: `src/components/icon-button/icon-button.test.tsx`, `e2e/icon-button.spec.ts`

## Hooks

| Hook                      | Kind      | Values                                                                                  | Description                     |
| ------------------------- | --------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| `ui-icon-button`          | root      |                                                                                         | The `<button>`.                 |
| `ui-icon-button__icon`    | slot      |                                                                                         | The icon (also `ui-icon`).      |
| `ui-icon-button__spinner` | slot      |                                                                                         | Busy indicator while pending.   |
| `data-variant`            | attribute | `primary`, `secondary`, `tertiary`, `danger`, `ghost`, `accent`, `chip`, `link`, `bare` | Emphasis and chrome.            |
| `data-size`               | attribute | `xs`, `sm`, `md`, `lg`                                                                  | Box size.                       |
| `data-selected`           | state     | `true`                                                                                  | The current choice.             |
| `data-disabled`           | state     | `true`                                                                                  | Disabled (also when focusable). |
| `data-pending`            | state     | `true`                                                                                  | Pending; presses are refused.   |
| `data-hovered`            | state     | `true`                                                                                  | Pointer over the button.        |
| `data-pressed`            | state     | `true`                                                                                  | Being pressed.                  |
| `data-focused`            | state     | `true`                                                                                  | Focused.                        |
| `data-focus-visible`      | state     | `true`                                                                                  | Keyboard focus.                 |
