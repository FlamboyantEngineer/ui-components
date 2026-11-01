# Button

`Button` renders a labelled or icon-only command, or a link when `href` is given. Promise-returning commands manage their pending state automatically; synchronous commands remain synchronous. Visual emphasis is independent of the action's timing.

## UIC-BUTTON-1 - Contract

### UIC-BUTTON-1.1 - Element and press handling

`Button` shall render a native `<button>` of type `button` unless `type` asks for `submit` or `reset`. It shall report activation through `onPress` (a library `PressEvent`) for pointer, keyboard (Enter and Space) and virtual clicks, and work as the trigger of the library's overlays (menus, dialogs, popovers and tooltips). Its accessible name is its label, or `aria-label`; `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-current` and `aria-describedby` pass through.

Inside a Modal, modified Enter belongs to the dialog's primary shortcut ([UIC-MODAL-6.1](MODAL.md#uic-modal-61---controlenter)): the button leaves it to the bubbling dialog handler, while its caller key handler still runs once and may consume it. Unmodified Enter and Space, and buttons outside that boundary, retain their ordinary press behavior.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.2 - Variants

`variant` shall publish `data-variant`: `secondary` (the default, a neutral command), `primary` (the one action a surface is for), `tertiary` (low emphasis), `danger` (destructive), `ghost` (no resting fill, for dense rows and toolbars), `accent` (a highlighted creation action), `chip` (a compact bordered token among many), `link` (reads as a link in running text) or `bare` (no chrome; the host surface styles it).

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.3 - Sizes

`size` shall publish `data-size`: `xs`, `sm`, `md` (the default) or `lg`. The reference sheet draws 20, 24, 28 and 32 pixel blocks.

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`

### UIC-BUTTON-1.4 - Content and alignment

By default (`content="label"`) the children shall sit in one `ui-button__label` slot. With `content="parts"` they sit directly in the button so the caller lays out its own parts; with `content="sentence"` a prose label may wrap. `content`, `align` (`center` by default, or `start` for scannable rows) and `fullWidth` publish `data-content`, `data-align` and `data-full-width`.

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-1.5 - Icons

`startIcon` and `endIcon` shall draw an imported icon component or rendered element as a decorative [Icon](ICON.md) in the `ui-button__start-icon` and `ui-button__end-icon` slots, before and after the label.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

### UIC-BUTTON-1.6 - Tooltip

`tooltip` shall show its content in a [Tooltip](TOOLTIP.md) for the button, opened by hover and keyboard focus, without wrapping the `<button>` in another element. A pending button still shows it. A natively disabled button receives no hover or focus and so shows no tooltip; with `focusableWhenDisabled` it does, which explains why a command is unavailable. A tooltip or shortcut that comes or goes, or a hint that changes, keeps the same `<button>` or link element, its ref, its content and its focus; a hint that goes while open closes its tooltip. A button inside a caller's own `Tooltip` or `HoverCard` trigger, with a hint or without, leaves that trigger to the caller: its own hint yields, so the caller's tooltip or card opens on hover, focus and long press and the button keeps the caller's `aria-haspopup`, `aria-expanded` and description.

Implementation: `src/components/button/button.tsx`, `src/components/tooltip/tooltip.tsx`, `src/components/tooltip/caller-trigger.ts`
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

With `href` the button shall be a link: an `<a>` with the same hooks and parts, drawn through the provider's `renderLink` so the host's router can take it ([PROVIDER.md](PROVIDER.md)), navigating through the provider's `navigate` when the host sets one, and reporting `onPress`. `target` and `rel` pass through, and `target="_blank"` adds `noopener` and `noreferrer` to the caller's `rel`, as a [Link](LINK.md#uic-link-22---new-tabs) does. `isExternal` opens the destination in a new tab (`target="_blank"` unless `target` is given). A link that opens a new tab (an enabled link whose target is `_blank`, from `isExternal` or `target`) shall show the external-link glyph (`ExternalLinkGlyph`) in the `ui-button__end-icon` slot and add the provider's `opensInNewTab` text, visually hidden in the `ui-button__new-tab-label` slot, to its name. A given `endIcon` replaces the glyph, and `endIcon={null}` or `false` shows none; the hidden text stays. An icon-only link shows no extra glyph and is named by its `label` followed by that text. A link that opens in the same tab gets neither, however its address reads. A disabled link renders as a `<span>` with role `link`, `aria-disabled="true"` and `data-disabled`, without `href`, `target` or `rel`. The link takes the button's name and description (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`), `id`, `aria-current`, `autoFocus`, `hidden` and the press, hover, focus and key handlers of UIC-BUTTON-1.10. `tooltip` and `shortcut` work as on a button; `render`, `type`, `isPending`, `isSelected`, the toggle state, `focusableWhenDisabled`, `excludeFromTabOrder`, `preventFocusOnPress`, `slot`, `role` and the toggle and popup states (`aria-pressed`, `aria-checked`, `aria-selected`, `aria-haspopup`, `aria-expanded`, `aria-controls`) apply to a `<button>` only, because `render` keeps the element type. `ref` reaches the `<a>`.

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`, `test/bundle.test.ts`, `e2e/button.spec.ts`

### UIC-BUTTON-1.10 - Handlers and focus options

Beside `onPress`, the button shall report `onPressStart`, `onPressEnd`, `onPressUp` and `onPressChange`, `onHoverStart`, `onHoverEnd` and `onHoverChange`, `onFocus`, `onBlur` and `onFocusChange`, and `onKeyDown` and `onKeyUp`, with the library's event types. `autoFocus` focuses it on mount, `excludeFromTabOrder` keeps it pressable but out of the Tab order, `preventFocusOnPress` leaves focus where it was when it is pressed (a button inside a field), and `hidden` hides it with the native attribute, which the reference stylesheet honours over its display rules (at any width and variant, as a button or a link), so a hidden button takes no space, focus or press. `slot` names the part of an enclosing library component the button fills (a calendar's `previous` and `next`), and `slot={null}` keeps it out of any part. A button in a slot takes the disabled state of the component around it (a disabled `Disclosure` or `DisclosureGroup` disables its trigger) unless it sets `isDisabled` itself; leaving the prop out never enables a control its parent disabled, so it neither runs its own `onPress` nor its parent's, and leaves the tab order.

Implementation: `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`, `src/components/button/button-slot.test.tsx`

## UIC-BUTTON-2 - States

### UIC-BUTTON-2.1 - Disabled

`isDisabled` shall set the native `disabled` attribute and `data-disabled`. With `focusableWhenDisabled` the button stays in the focus order with `aria-disabled="true"` and `data-disabled`, keeps its focus, hover and tooltip (including the first physical pointer entry before any earlier pointer interaction), and never submits a form. It refuses every activation by pointer, keyboard (Enter, Space and the arrow keys a menu trigger opens with) or programmatic and virtual click: its own `onPress` and press lifecycle callbacks (`onPressStart`, `onPressEnd`, `onPressUp`, `onPressChange`) and the handlers a trigger it sits in adds, such as a `MenuTrigger`'s or `PopoverTrigger`'s, never run. A `render` callback receives `isDisabled: true`. A press on a natively disabled button ends with the pointer's release, so the first press once it is enabled again runs `onPress`.

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button.test.tsx`, `src/components/button/button-inherited-press.test.tsx`, `e2e/button.spec.ts`

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

## UIC-BUTTON-3 - Unified options

### UIC-BUTTON-3.1 - Unified commands

Button shall offer icon-only content through icon and an accessible label. Promise-returning presses automatically refuse repeats and manage pending; synchronous presses neither wait nor show a pending state.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button.test.tsx`

## UIC-BUTTON-11 - Contract

### UIC-BUTTON-11.1 - Icon and name

`Button` shall draw its `icon` (an imported icon component or rendered element) as a decorative [Icon](ICON.md) in the `ui-button__icon` slot and name the button with its required `label` through `aria-label`. An empty label is an error. An `icon` of `undefined`, `null` or `false` is no icon (as for `startIcon` and `endIcon`): the button stays a labelled button, in both button and link modes, with its children as its label, its `secondary` default and `data-content="label"`, so a conditional icon such as `icon={isDone && CheckGlyph}` never selects icon-only mode. A button with no icon and no children shows its `label` as its visible text (in the `ui-button__label` slot), so a control whose optional icon is absent stays visible and named.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/button-icon.spec.ts`

### UIC-BUTTON-11.2 - Variants and sizes

`variant` (Button's variants, `ghost` by default) and `size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-variant` and `data-size`. The reference sheet draws square 22, 26, 32 and 38 pixel boxes.

Implementation: `src/components/button/button.tsx`, `labs/reference/button.css`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/button-icon.spec.ts`

### UIC-BUTTON-11.3 - States

`Button` shall offer Button's states with the same semantics, through the same React Aria wiring: `isDisabled` with optional `focusableWhenDisabled`, `isPending` (an indeterminate progress bar named by `pendingLabel` replaces the icon in the `ui-button__spinner` slot), `isSelected` with toggle semantics, and React Aria's interaction states. While pending, the button is named by its `label` followed by the busy indicator's name ("More Loading"), as React Aria names a pending button that has `aria-label`.

Implementation: `src/components/button/button.tsx`, `src/components/button/button.tsx`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/button-icon.spec.ts`

### UIC-BUTTON-11.4 - Hooks and caller attributes

`Button` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref`.

Implementation: `src/components/button/button.tsx`
Verification: `src/components/button/button-icon.test.tsx`

### UIC-BUTTON-11.5 - Tooltip

`tooltip` shall show its content in a [Tooltip](TOOLTIP.md) for the button with the same rules as [Button](BUTTON.md)'s `tooltip`: hover and keyboard focus open it, no wrapper element is added, and a natively disabled button shows none unless it is `focusableWhenDisabled`. The tooltip describes the button, unless it only repeats the label (UIC-BUTTON-11.7); `label` stays its accessible name.

Implementation: `src/components/button/button.tsx`, `src/components/tooltip/tooltip.tsx`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-BUTTON-11.6 - Keyboard shortcut

`shortcut` shall work as on [Button](BUTTON.md): `aria-keyshortcuts` and a [Shortcut](SHORTCUT.md) after the hint in the tooltip, never a listener. Because the button shows no text, a shortcut without a `tooltip` shows the `label` before the chord.

Implementation: `src/components/button/button.tsx`, `src/components/button/button.tsx`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/button-icon.spec.ts`

### UIC-BUTTON-11.7 - Tooltip as the name

A `tooltip` that is exactly the `label`, and shows no shortcut, shall name the button rather than describe it: the open tooltip adds no `aria-describedby`, so a screen reader announces the name once. A caller's own `aria-describedby` stays. A tooltip that says more than the label still describes the button.

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/button-icon.spec.ts`

### UIC-BUTTON-11.8 - Toggles, links and swapped elements

`Button` shall take Button's toggle state (`defaultSelected` and `onChange`), its links (`href`, `target`, `rel`: an `<a>` with the same hooks, named by `label`) and its `render` for the `<button>`, with Button's rules ([BUTTON.md](BUTTON.md)).

Implementation: `src/components/button/button.tsx`, `src/components/button/button-state.tsx`
Verification: `src/components/button/button-icon.test.tsx`, `e2e/button-icon.spec.ts`

## UIC-BUTTON-21 - Pending lifecycle

### UIC-BUTTON-21.1 - Pending while the action runs

When `onPress` returns a promise, `Button` shall be pending (Button's `isPending`: spinner, `data-pending`, `aria-disabled="true"`, visible label kept) from the press until the promise settles. Timing shall not change the visual variant: labelled commands default to `secondary`, icon-only commands to `ghost`.

Implementation: `src/components/button/button-action.tsx`
Verification: `src/components/button/button-action.test.tsx`, `e2e/button-action.spec.ts`

### UIC-BUTTON-21.2 - No repeat activation

While pending, the button shall refuse further activation by pointer, keyboard or programmatic click, so the action runs once per press until it settles. A `type="submit"` or `type="reset"` action button keeps its type: the press that starts the action submits or resets its form, whatever its modality (pointer, touch, Enter, Space, which presses before its click, or a programmatic click), and the native activation of every later click (pointer, keyboard, implicit submission or programmatic) is cancelled until the action settles, also while `pendingDelay` holds the pending state back.

Implementation: `src/components/button/button-action.tsx`
Verification: `src/components/button/button-action.test.tsx`, `e2e/button-action.spec.ts`

### UIC-BUTTON-21.3 - Settling

After the action resolves or rejects, the button shall return to its idle state. A rejection shall reach `onError`; without `onError` it is rethrown rather than swallowed.

Implementation: `src/components/button/button-action.tsx`
Verification: `src/components/button/button-action.test.tsx`, `e2e/button-action.spec.ts`

### UIC-BUTTON-21.4 - Disabled

A disabled action button shall never start its action and shall stay disabled after an action settles.

Implementation: `src/components/button/button-action.tsx`
Verification: `src/components/button/button-action.test.tsx`

### UIC-BUTTON-21.5 - Controlled pending and pending name

A caller's `isPending` shall override the internal pending state. While pending the button keeps its label, and its busy indicator is named by `pendingLabel`, or the provider's `loading` string; a button named by `aria-label` is named by that label followed by the busy indicator's name, as in Button (UIC-BUTTON-2.2). `runPendingAction` exposes the same lifecycle for hosts that run an action from elsewhere (for example a keyboard shortcut).

Implementation: `src/components/button/button-action.tsx`
Verification: `src/components/button/button-action.test.tsx`

### UIC-BUTTON-21.6 - Hint and shortcut

`Button` shall pass Button's `tooltip` and `shortcut` through ([BUTTON.md](BUTTON.md)): the tooltip shows the hint and the chord, the button publishes `aria-keyshortcuts`, and both stay while the action is pending. A host that binds the chord runs the action through `runPendingAction`.

Implementation: `src/components/button/button-action.tsx`, `src/components/button/button.tsx`
Verification: `src/components/button/button-action.test.tsx`, `e2e/button-action.spec.ts`

### UIC-BUTTON-21.7 - Pending delay

`pendingDelay` (milliseconds, 0 by default) shall hold back the pending state, internal or controlled, until the action has run that long, so an action that settles sooner never flashes the spinner. The button refuses activation from the first press either way: while an action it started is unsettled or the caller's `isPending` holds, before and after the indicator shows, it refuses its own `onPress`, its press lifecycle callbacks and the handlers a trigger it sits in adds (a `MenuTrigger`'s or `PopoverTrigger`'s, by pointer, keyboard including a menu's arrow keys, or programmatic and virtual click), keeping focus, hover and its tooltip. A submit or reset button still submits or resets with the press that started the action, as UIC-BUTTON-21.2 describes. An action button is never a link, so it takes no `href`.

Implementation: `src/components/button/button-action.tsx`, `src/components/button/button-state.tsx`, `src/utils/use-delayed-flag.ts`
Verification: `src/components/button/button-action.test.tsx`, `src/components/button/button-inherited-press.test.tsx`, `src/utils/use-delayed-flag.test.ts`, `e2e/button-action.spec.ts`, `e2e/button.spec.ts`

## Hooks

| Hook                       | Kind      | Values                                                                                  | Description                                                               |
| -------------------------- | --------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ui-button`                | root      |                                                                                         | The `<button>`, or `<a>` with `href`.                                     |
| `ui-button__label`         | slot      |                                                                                         | The label, unless `content="parts"`.                                      |
| `ui-button__start-icon`    | slot      |                                                                                         | Leading icon (also `ui-icon`).                                            |
| `ui-button__end-icon`      | slot      |                                                                                         | Trailing icon (also `ui-icon`).                                           |
| `ui-button__spinner`       | slot      |                                                                                         | Busy indicator while pending.                                             |
| `ui-button__new-tab-label` | slot      |                                                                                         | Visually hidden "opens in a new tab" text of a link that opens a new tab. |
| `data-variant`             | attribute | `primary`, `secondary`, `tertiary`, `danger`, `ghost`, `accent`, `chip`, `link`, `bare` | Emphasis and chrome.                                                      |
| `data-size`                | attribute | `xs`, `sm`, `md`, `lg`                                                                  | Block size.                                                               |
| `data-content`             | attribute | `label`, `parts`, `sentence`, `icon`                                                    | The content layout.                                                       |
| `data-align`               | attribute | `center`, `start`                                                                       | Content alignment.                                                        |
| `data-full-width`          | state     | `true`                                                                                  | Fills the container's width.                                              |
| `data-selected`            | state     | `true`                                                                                  | The current choice.                                                       |
| `data-disabled`            | state     | `true`                                                                                  | Disabled (also when focusable).                                           |
| `data-pending`             | state     | `true`                                                                                  | Pending; presses are refused.                                             |
| `data-hovered`             | state     | `true`                                                                                  | Pointer over the button.                                                  |
| `data-pressed`             | state     | `true`                                                                                  | Being pressed.                                                            |
| `data-focused`             | state     | `true`                                                                                  | Focused.                                                                  |
| `data-focus-visible`       | state     | `true`                                                                                  | Keyboard focus.                                                           |

| `ui-button__icon` | slot | | The decorative icon in icon-only mode. |
