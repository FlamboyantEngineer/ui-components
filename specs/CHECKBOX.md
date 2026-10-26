# Checkbox

`Checkbox` is a tick box, built on React Aria's `Checkbox`: a native checkbox input, visually hidden but focusable, inside a `<label>` with a drawn box and an optional visible label. It reports whether it is ticked and may show a mixed state, for a value that is inherited or differs across several items. A true-or-false value with a field around it (label layout, validation, dirty state, undo) is a [Boolean Field](BOOLEAN-FIELD.md), which draws this checkbox.

## UIC-CHECKBOX-1 - Contract

### UIC-CHECKBOX-1.1 - Box and label

`Checkbox` shall render a `<label>` (`ui-checkbox`) around a visually hidden native checkbox input, a box (`ui-checkbox__box`, hidden from assistive technology) and its children in `ui-checkbox__label`. The box draws the `check` glyph while ticked and the `minus` glyph while mixed (`ui-checkbox__glyph`), and nothing while empty. It takes `isSelected` (controlled) or `defaultSelected` (uncontrolled) with `onChange`, `isIndeterminate`, `name` and `value` (submitted while ticked, `on` by default), `isRequired`, `isInvalid`, `isReadOnly`, `isDisabled`, `validationBehavior` (`native` by default, which makes a required box a native constraint; `aria` reports through ARIA only), `inputRef` (the native input) and the labelling props.

Implementation: `src/components/checkbox/checkbox.tsx`, `labs/reference/checkbox.css`
Verification: `src/components/checkbox/checkbox.test.tsx`, `e2e/checkbox.spec.ts`

### UIC-CHECKBOX-1.2 - Pressing

Pressing the box or the label text, or pressing Space on the focused input, shall toggle the box and report the new state through `onChange`. A read-only box keeps its state and reports nothing; a disabled one is natively disabled and leaves the focus order.

Implementation: `src/components/checkbox/checkbox.tsx`
Verification: `src/components/checkbox/checkbox.test.tsx`, `e2e/checkbox.spec.ts`

### UIC-CHECKBOX-1.3 - Accessibility

The input shall be named by the children, or by `aria-label` or `aria-labelledby` when the box has no text, and carry the caller's `id`. A mixed box sets its input's native indeterminate state, which assistive technology reports as mixed; a read-only one reports `aria-readonly="true"`, and an invalid one `aria-invalid="true"`. Keyboard focus publishes `data-focus-visible` on the root so the stylesheet can ring the box.

Implementation: `src/components/checkbox/checkbox.tsx`
Verification: `src/components/checkbox/checkbox.test.tsx`, `e2e/checkbox.spec.ts`

### UIC-CHECKBOX-1.4 - Hooks and caller attributes

`Checkbox` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes to it. `size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root, so a stylesheet sizes the box and gives the row the height of that size on the control scale.

Implementation: `src/components/checkbox/checkbox.tsx`
Verification: `src/components/checkbox/checkbox.test.tsx`

### UIC-CHECKBOX-1.5 - Selection checkbox

With `slot="selection"`, a checkbox inside a selectable list row, tree row or card shall show and toggle that item's selection: it is ticked while the item is selected, and pressing it selects or deselects the item.

Implementation: `src/components/checkbox/checkbox.tsx`
Verification: `src/components/checkbox/checkbox.test.tsx`

## UIC-CHECKBOX-2 - Three states

### UIC-CHECKBOX-2.1 - Cycling three states

`cycleCheckState(value)` shall give the state after a press of a three-state box: unset (`null`, drawn mixed) becomes ticked, ticked becomes empty and empty becomes unset again. A caller drives a three-state box with it: `isSelected={value === true}`, `isIndeterminate={value === null}` and `onChange={() => setValue(cycleCheckState(value))}`.

Implementation: `src/components/checkbox/checkbox.tsx`
Verification: `src/components/checkbox/checkbox.test.tsx`

## Hooks

| Hook                 | Kind      | Values                 | Description                                |
| -------------------- | --------- | ---------------------- | ------------------------------------------ |
| `ui-checkbox`        | root      |                        | The `<label>` around the input.            |
| `ui-checkbox__box`   | slot      |                        | The drawn box.                             |
| `ui-checkbox__glyph` | slot      |                        | The tick or dash glyph inside the box.     |
| `ui-checkbox__label` | slot      |                        | The visible label text.                    |
| `data-size`          | attribute | `xs`, `sm`, `md`, `lg` | Row size.                                  |
| `data-selected`      | state     | `true`                 | Ticked (React Aria).                       |
| `data-indeterminate` | state     | `true`                 | Mixed (React Aria).                        |
| `data-pressed`       | state     | `true`                 | Being pressed (React Aria).                |
| `data-hovered`       | state     | `true`                 | Under the pointer (React Aria).            |
| `data-focused`       | state     | `true`                 | The input has focus (React Aria).          |
| `data-focus-visible` | state     | `true`                 | The input has keyboard focus (React Aria). |
| `data-disabled`      | state     | `true`                 | Disabled (React Aria).                     |
| `data-readonly`      | state     | `true`                 | Read-only (React Aria).                    |
| `data-invalid`       | state     | `true`                 | Invalid (React Aria).                      |
| `data-required`      | state     | `true`                 | Must be ticked (React Aria).               |
