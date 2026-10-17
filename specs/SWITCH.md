# Switch

`Switch` is an on-off switch on React Aria's `Switch`, usable without a field around it (settings lists, toolbars): a native input with role `switch`, visually hidden but focusable, inside a `<label>` with a drawn track and thumb and an optional visible label. It reports whether it is on. An on-off value with a field around it (label layout, validation, dirty state, undo) is a [Boolean Field](BOOLEAN-FIELD.md) with the `switch` variant.

## UIC-SWITCH-1 - Contract

### UIC-SWITCH-1.1 - Track, thumb and label

`Switch` shall render a `<label>` (`ui-switch`) around a visually hidden native input with role `switch`, a track (`ui-switch__track`, hidden from assistive technology) holding a thumb (`ui-switch__thumb`), and its children in `ui-switch__label`. React Aria's switch props pass through: `isSelected`, `defaultSelected` and `onChange`, `name`, `value`, `isReadOnly`, `isDisabled`, `autoFocus`, `inputRef` and the others.

Implementation: `src/components/switch/switch.tsx`, `labs/reference/switch.css`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.2 - Flipping

Pressing the track or the label text, or pressing Space on the focused input, shall flip the switch and report the new state through `onChange`. A read-only switch keeps its state and reports nothing; a disabled one is natively disabled and leaves the focus order.

Implementation: `src/components/switch/switch.tsx`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.3 - Accessibility and form value

The input shall be named by the children, or by `aria-label` or `aria-labelledby` when the switch has no text, and carry the caller's `id`. With `name`, a form submits `value` (`on` by default) while the switch is on. Keyboard focus publishes React Aria's `data-focus-visible` on the root, so the stylesheet can ring the track.

Implementation: `src/components/switch/switch.tsx`
Verification: `src/components/switch/switch.test.tsx`, `e2e/switch.spec.ts`

### UIC-SWITCH-1.4 - Hooks and caller attributes

`Switch` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes to it.

Implementation: `src/components/switch/switch.tsx`
Verification: `src/components/switch/switch.test.tsx`

## Hooks

| Hook                 | Kind  | Values | Description                                |
| -------------------- | ----- | ------ | ------------------------------------------ |
| `ui-switch`          | root  |        | The `<label>` around the input.            |
| `ui-switch__track`   | slot  |        | The drawn track.                           |
| `ui-switch__thumb`   | slot  |        | The thumb inside the track.                |
| `ui-switch__label`   | slot  |        | The visible label text.                    |
| `data-selected`      | state | `true` | On (React Aria).                           |
| `data-pressed`       | state | `true` | Being pressed (React Aria).                |
| `data-hovered`       | state | `true` | Under the pointer (React Aria).            |
| `data-focused`       | state | `true` | The input has focus (React Aria).          |
| `data-focus-visible` | state | `true` | The input has keyboard focus (React Aria). |
| `data-disabled`      | state | `true` | Disabled (React Aria).                     |
| `data-readonly`      | state | `true` | Read-only (React Aria).                    |
