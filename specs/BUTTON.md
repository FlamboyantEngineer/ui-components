# Button

`Button` is a labelled command button built on React Aria's `Button`, or with `href` a link drawn as a button. Its `variant` chooses emphasis and chrome, `size` its block size, and it publishes its interaction states plus `data-selected`. An icon-only command is an [Icon Button](ICON-BUTTON.md); an action that runs asynchronous work is an [Action Button](ACTION-BUTTON.md); related buttons sit together in a [Button Group](BUTTON-GROUP.md).

## UIC-BUTTON-1 - Contract

### UIC-BUTTON-1.1 - Element and press handling

`Button` shall render a native `<button>` of type `button` unless `type` asks for `submit` or `reset`. It shall report activation through `onPress` (a library `PressEvent`) for pointer, keyboard (Enter and Space) and virtual clicks, and work as the trigger of the library's overlays (menus, dialogs, popovers and tooltips). Its accessible name is its label, or `aria-label`; `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-current` and `aria-describedby` pass through.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.2 - Variants

`variant` shall publish `data-variant`: `secondary` (the default, a neutral command), `primary` (the one action a surface is for), `tertiary` (low emphasis), `danger` (destructive), `ghost` (no resting fill, for dense rows and toolbars), `accent` (a highlighted creation action), `chip` (a compact bordered token among many), `link` (reads as a link in running text) or `bare` (no chrome; the host surface styles it).

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.3 - Sizes

`size` shall publish `data-size`: `xs`, `sm`, `md` (the default) or `lg`. The reference sheet draws 22, 26, 32 and 38 pixel blocks.

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.4 - Content and alignment

By default (`content="label"`) the children shall sit in one `ui-button__label` slot. With `content="parts"` they sit directly in the button so the caller lays out its own parts; with `content="sentence"` a prose label may wrap. `content`, `align` (`center` by default, or `start` for scannable rows) and `fullWidth` publish `data-content`, `data-align` and `data-full-width`.

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-1.5 - Icons

`startIcon` and `endIcon` shall draw a built-in glyph name or any icon node as a decorative [Icon](ICON.md) in the `ui-button__start-icon` and `ui-button__end-icon` slots, before and after the label.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-1.6 - Tooltip

`tooltip` shall show its content in a [Tooltip](TOOLTIP.md) for the button, opened by hover and keyboard focus, without wrapping the `<button>` in another element. A pending button still shows it. A natively disabled button receives no hover or focus and so shows no tooltip; with `focusableWhenDisabled` it does, which explains why a command is unavailable.

Implementation: `src/components/button/button.tsx`, `src/components/tooltip/tooltip.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-BUTTON-1.7 - Keyboard shortcut

`shortcut` shall report a keyboard chord that runs the same command elsewhere (`Ctrl+S`, or `{ key, modifiers }`, as [Shortcut](SHORTCUT.md) writes it). The button publishes it as `aria-keyshortcuts` (`formatAriaKeyShortcuts` for the reader's platform, in the server's notation while hydrating so the markup matches), and its tooltip draws it as a [Shortcut](SHORTCUT.md) after the `tooltip` hint, separated by a space, or alone without a hint, with the chord's readable words in the description the open tooltip gives the button. The button never registers or listens for the chord; the host binds it. A chord with an empty key adds nothing.

Implementation: `src/components/button/button.tsx`, `src/components/shortcut/shortcut.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.8 - Swapping the element

`render(props, state)`, typed `ElementRender<'button', ButtonRenderState>`, shall replace the `<button>` ([COMPOSITION.md](COMPOSITION.md)): the caller's `<button>` receives the hook classes and data attributes, the handlers and states, the `role`, `aria-checked`, `aria-selected` and `aria-keyshortcuts` the button adds, and the `ref`, and `state` is a `ButtonRenderState` (`isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`, `isPending`).

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-1.9 - Links

With `href` the button shall be a link: an `<a>` with the same hooks and parts, drawn through the provider's `renderLink` so the host's router can take it ([PROVIDER.md](PROVIDER.md)), navigating through the provider's `navigate` when the host sets one, and reporting `onPress`. `target` and `rel` pass through, and `target="_blank"` adds `rel="noopener noreferrer"` unless `rel` is given. A disabled link renders as a `<span>` with role `link`, `aria-disabled="true"` and `data-disabled`, without `href`, `target` or `rel`. The link takes the button's name and description (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`), `id`, `aria-current`, `autoFocus`, `hidden` and the press, hover, focus and key handlers of UIC-BUTTON-1.10. `tooltip` and `shortcut` work as on a button; `render`, `type`, `isPending`, `isSelected`, the toggle state, `focusableWhenDisabled`, `excludeFromTabOrder`, `preventFocusOnPress`, `slot`, `role` and the toggle and popup states (`aria-pressed`, `aria-checked`, `aria-selected`, `aria-haspopup`, `aria-expanded`, `aria-controls`) apply to a `<button>` only, because `render` keeps the element type. `ref` reaches the `<a>`.

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.10 - Handlers and focus options

Beside `onPress`, the button shall report `onPressStart`, `onPressEnd`, `onPressUp` and `onPressChange`, `onHoverStart`, `onHoverEnd` and `onHoverChange`, `onFocus`, `onBlur` and `onFocusChange`, and `onKeyDown` and `onKeyUp`, with the library's event types. `autoFocus` focuses it on mount, `excludeFromTabOrder` keeps it pressable but out of the Tab order, `preventFocusOnPress` leaves focus where it was when it is pressed (a button inside a field), and `hidden` hides it with the native attribute. `slot` names the part of an enclosing library component the button fills (a calendar's `previous` and `next`), and `slot={null}` keeps it out of any part.

Implementation: `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`

## UIC-BUTTON-2 - States

### UIC-BUTTON-2.1 - Disabled

`isDisabled` shall set the native `disabled` attribute and `data-disabled`. With `focusableWhenDisabled` the button stays in the focus order with `aria-disabled="true"` and `data-disabled`, refuses activation by pointer, Enter and Space, and never submits a form.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-2.2 - Pending

`isPending` shall keep the button focusable but refuse presses, set `aria-disabled="true"` and `data-pending`, draw an indeterminate progress bar in the `ui-button__spinner` slot, named by `pendingLabel` or the provider's `loading` string, keep its icons and label in place so the button keeps its size (a stylesheet draws the spinner over them), and never submit a form. React Aria names a pending button that has `aria-label` by that label followed by the busy indicator's name ("More Loading"). The change to and from pending is announced while the button has focus.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-2.3 - Selected and toggle state

`isSelected` shall mark the button as the current choice with `data-selected` and, unless the caller states toggle semantics itself through `aria-pressed`, `aria-checked` or a `role`, with `aria-pressed="true"`. A caller's `aria-pressed` (`true`, `false` or `mixed`) passes through unchanged.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-2.4 - Interaction states

The button shall publish its interaction states: `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-2.5 - Hooks and caller attributes

`Button` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `ref` to the `<button>`, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-2.6 - Toggle state

With `defaultSelected` or `onChange` the button shall be a toggle: every press (after `onPress`) flips its selected state and reports the new state through `onChange`, and it states `aria-pressed` (`true` or `false`) unless the caller states toggle semantics (UIC-BUTTON-2.3), with `data-selected` while selected. `defaultSelected` sets the initial state of a toggle that keeps its own; with `isSelected` as well the caller controls it and the press only reports the requested state. Without either, `isSelected` only shows the state.

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

## Hooks

| Hook                    | Kind      | Values                                                                                  | Description                           |
| ----------------------- | --------- | --------------------------------------------------------------------------------------- | ------------------------------------- |
| `ui-button`             | root      |                                                                                         | The `<button>`, or `<a>` with `href`. |
| `ui-button__label`      | slot      |                                                                                         | The label, unless `content="parts"`.  |
| `ui-button__start-icon` | slot      |                                                                                         | Leading icon (also `ui-icon`).        |
| `ui-button__end-icon`   | slot      |                                                                                         | Trailing icon (also `ui-icon`).       |
| `ui-button__spinner`    | slot      |                                                                                         | Busy indicator while pending.         |
| `data-variant`          | attribute | `primary`, `secondary`, `tertiary`, `danger`, `ghost`, `accent`, `chip`, `link`, `bare` | Emphasis and chrome.                  |
| `data-size`             | attribute | `xs`, `sm`, `md`, `lg`                                                                  | Block size.                           |
| `data-content`          | attribute | `label`, `parts`, `sentence`                                                            | How children are laid out.            |
| `data-align`            | attribute | `center`, `start`                                                                       | Content alignment.                    |
| `data-full-width`       | state     | `true`                                                                                  | Fills the container's width.          |
| `data-selected`         | state     | `true`                                                                                  | The current choice.                   |
| `data-disabled`         | state     | `true`                                                                                  | Disabled (also when focusable).       |
| `data-pending`          | state     | `true`                                                                                  | Pending; presses are refused.         |
| `data-hovered`          | state     | `true`                                                                                  | Pointer over the button.              |
| `data-pressed`          | state     | `true`                                                                                  | Being pressed.                        |
| `data-focused`          | state     | `true`                                                                                  | Focused.                              |
| `data-focus-visible`    | state     | `true`                                                                                  | Keyboard focus.                       |
