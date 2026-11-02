# Switch

`Switch` is an on-off switch, built on React Aria's `Switch`, usable without a field around it (settings lists, toolbars): a native input with role `switch`, visually hidden but focusable, inside a `<label>` with a drawn track and thumb and an optional visible label. It reports whether it is on. An on-off value with a field around it (label layout, validation, dirty state, undo) is a [Boolean Field](BOOLEAN-FIELD.md) with the `switch` variant.

## UIC-SWITCH-1 - Contract

### UIC-SWITCH-1.1 - Track, thumb and label

`Switch` shall render a `<label>` (`ui-switch`) around a visually hidden native input with role `switch`, a track (`ui-switch__track`, hidden from assistive technology) holding a thumb (`ui-switch__thumb`), and its children in `ui-switch__label`, which name the input. Children that render nothing (`null`, `undefined`, a boolean or an empty string) draw no label slot; any other content, `0` included, draws it. The reference thumb shall stay circular while pressed and throughout its slide between states. It takes `isSelected` (controlled) or `defaultSelected` (uncontrolled) with `onChange`, `name` and `value`, `isReadOnly`, `isDisabled`, `autoFocus` (focus the input when it mounts), `inputRef` (the native input) and the labelling props, and `isRequired`, `isInvalid` and `validationBehavior` for a switch inside a field (a Boolean Field's). `isIndeterminate` publishes `data-indeterminate` for a value that is neither on nor off, such as a Boolean Field's unset value; the reference thumb then sits in the middle of the track.

Implementation: `src/components/switch/switch.tsx`, `labs/reference/switch.css`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.2 - Flipping

Pressing the track or the label text, or pressing Space on the focused input, shall flip the switch and report the new state through `onChange`. A read-only switch keeps its state and reports nothing; a disabled one is natively disabled and leaves the focus order.

Implementation: `src/components/switch/switch.tsx`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.3 - Accessibility and form value

The input shall be named by the children, or by `aria-label` or `aria-labelledby` when the switch has no text, and carry the caller's `id`. With `name`, a form submits `value` (`on` by default) while the switch is on. Keyboard focus publishes `data-focus-visible` on the root, so the stylesheet can ring the track.

Implementation: `src/components/switch/switch.tsx`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.4 - Hooks and caller attributes

`Switch` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes to it. `size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root, so a stylesheet gives the row the height of that size on the control scale and sizes the track and thumb with it: the reference sheet draws 22×12, 26×14, 30×18 and 34×20 pixel tracks with 6, 8, 10 and 12 pixel thumbs that keep the same inset at either end, the one geometry a bare switch and a Boolean Field's switch share.

Implementation: `src/components/switch/switch.tsx`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.5 - Native form reset

A native reset of the form the switch submits with shall apply once every listener has seen it, and never when one cancelled it: then the switch keeps its state and reports no change. A reset that goes through puts back the state the switch mounted with: an uncontrolled switch returns to `defaultSelected`, and a controlled one reports that state through `onChange` once. The submitted value follows.

Implementation: `src/components/switch/switch.tsx`, `src/utils/use-reset-held-value.ts`, `src/utils/use-native-reset.ts`
Verification: `src/components/switch/switch.test.tsx`

## Hooks

| Hook                 | Kind      | Values                 | Description                                |
| -------------------- | --------- | ---------------------- | ------------------------------------------ |
| `ui-switch`          | root      |                        | The `<label>` around the input.            |
| `ui-switch__track`   | slot      |                        | The drawn track.                           |
| `ui-switch__thumb`   | slot      |                        | The thumb inside the track.                |
| `ui-switch__label`   | slot      |                        | The visible label text.                    |
| `data-size`          | attribute | `xs`, `sm`, `md`, `lg` | Row size.                                  |
| `data-selected`      | state     | `true`                 | On (React Aria).                           |
| `data-indeterminate` | state     | `true`                 | Neither on nor off (`isIndeterminate`).    |
| `data-invalid`       | state     | `true`                 | Invalid (`isInvalid`, React Aria).         |
| `data-pressed`       | state     | `true`                 | Being pressed (React Aria).                |
| `data-hovered`       | state     | `true`                 | Under the pointer (React Aria).            |
| `data-focused`       | state     | `true`                 | The input has focus (React Aria).          |
| `data-focus-visible` | state     | `true`                 | The input has keyboard focus (React Aria). |
| `data-disabled`      | state     | `true`                 | Disabled (React Aria).                     |
| `data-readonly`      | state     | `true`                 | Read-only (React Aria).                    |
