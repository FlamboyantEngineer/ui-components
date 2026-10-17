# Combobox

`Combobox` is a text input with a list of suggestions, built on React Aria's `ComboBox`, `Label`, `Group`, `Input`, `Button`, `Popover` and `ListBox`. The reader types freely (with `allowsCustomValue`) or completes the text from the list. The combobox filters its own suggestions (`defaultItems`), or the caller filters them, synchronously or asynchronously, from `onInputChange` (`items`). React Aria owns the roles, the virtual focus in the list and the keyboard behaviour; its props pass through unchanged.

## UIC-COMBOBOX-1 - Field

### UIC-COMBOBOX-1.1 - Structure

`Combobox` shall render, inside its `ui-combobox` root: the `label` (`ui-combobox__label`), which names the input; a field group (`ui-combobox__field`) holding, for the `search` variant, a decorative search glyph (`ui-combobox__search-icon`), the text input with `role="combobox"` (`ui-combobox__input`), the busy indicator and the clear button when they apply, and the React Aria button that opens the list (`ui-combobox__button`); then the `description` (`ui-combobox__description`) and the `errorMessage` while invalid (`ui-combobox__error`). Without `label`, `aria-label` names the input.

Implementation: `src/components/combobox/combobox.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.2 - Variants and sizes

`variant` (`default` or `search`) and `size` (`sm`, `md` by default, `lg`) shall be published in `data-variant` and `data-size`. The reference sheet draws 26, 32 and 38 pixel high fields.

Implementation: `src/components/combobox/combobox.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.3 - States

`isDisabled`, `isReadOnly`, `isInvalid` and `isRequired` shall pass to React Aria, which publishes `data-disabled`, `data-readonly`, `data-invalid` and `data-required` on the root and keeps a disabled or read-only list closed; the root also publishes `data-focused` and `data-open`. `isPending` marks the caller still fetching suggestions: it publishes `data-pending`, sets `aria-busy="true"` on the input and draws a decorative busy indicator (`ui-combobox__spinner`) in the field.

Implementation: `src/components/combobox/combobox.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.4 - Clear button

While the input holds text and the combobox is neither disabled nor read-only, the field shall draw a bare small `IconButton` (`close` glyph, named by the provider string `clear`, also `ui-combobox__clear`) that empties the input and the selection and returns focus to the input.

Implementation: `src/components/combobox/combobox.tsx`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

## UIC-COMBOBOX-2 - Suggestions

### UIC-COMBOBOX-2.1 - Options and sections

Suggestions shall be options (`id`, `label`, optional `description`, `icon` as a built-in glyph name or node, and `isDisabled`) or sections (`id`, `title`, `options`). An option draws its icon (`ui-combobox__option-icon`), label (`ui-combobox__option-label`) and description (`ui-combobox__option-description`) in a `role="option"` row (`ui-combobox__option`), named by its label and description text; a section draws a group (`ui-combobox__section`) headed by its title (`ui-combobox__section-header`).

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.2 - Filtering

With `defaultItems`, the combobox shall show the options whose label contains the typed text, ignoring case, and drop sections left empty. With `items`, it shows exactly the given suggestions, so the caller filters them, for example after fetching them from `onInputChange` while `isPending`.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.3 - Opening

The list shall open in the `dropdown` layer as the reader types (`menuTrigger="input"`, the default), on focus (`focus`) or only on Arrow Down, Arrow Up or the button (`manual`); Arrow Down and Arrow Up open it from the input and the button toggles it. It closes when the input loses focus or a scroll container of the field scrolls.

Implementation: `src/components/combobox/combobox.tsx`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.4 - Keyboard and picking

While the list is open, focus shall stay in the input: Arrow Down and Arrow Up move the highlighted option (the input's `aria-activedescendant`, `data-focused` on the option) and pass over disabled options; Enter or a press picks the option, writes its label to the input, calls `onSelectionChange` with its `id` and closes the list; Escape closes the list. A disabled option cannot be picked.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.5 - Custom values

With `allowsCustomValue`, the typed text shall stay when the input loses focus or Escape closes the list, and no option is selected. Without it, the input returns to the selected option's label (or empties) when the reader leaves it.

Implementation: `src/components/combobox/combobox.tsx`
Verification: `src/components/combobox/combobox.test.tsx`

### UIC-COMBOBOX-2.6 - Empty list

When no suggestion matches, the list shall still open (`allowsEmptyCollection`, true by default) and show the provider string `noResults` in `ui-combobox__empty`.

Implementation: `src/components/combobox/combobox-suggestions.tsx`, `src/core/strings.ts`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.7 - Popover

The list's popover (`ui-combobox__popover`) shall sit on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')` ([PORTAL.md](PORTAL.md)), 4 pixels below the field and at least as wide as React Aria's measured `--trigger-width`, with the listbox (`ui-combobox__listbox`) inside.

Implementation: `src/components/combobox/combobox-suggestions.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.8 - Hooks and caller attributes

`Combobox` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `name` and `ref` to React Aria's `ComboBox`.

Implementation: `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox.test.tsx`, `src/components/combobox/combobox-suggestions.test.tsx`

## Hooks

| Hook                              | Kind      | Values                                     | Description                                               |
| --------------------------------- | --------- | ------------------------------------------ | --------------------------------------------------------- |
| `ui-combobox`                     | root      |                                            | The combobox wrapper.                                     |
| `ui-combobox__label`              | slot      |                                            | The visible label.                                        |
| `ui-combobox__field`              | slot      |                                            | The group framing the input and its buttons.              |
| `ui-combobox__search-icon`        | slot      |                                            | Leading search glyph of the `search` variant.             |
| `ui-combobox__input`              | slot      |                                            | The text input (`role="combobox"`).                       |
| `ui-combobox__spinner`            | slot      |                                            | Busy indicator while pending.                             |
| `ui-combobox__clear`              | slot      |                                            | The clear button (also `ui-icon-button`).                 |
| `ui-combobox__button`             | slot      |                                            | The button that opens the list.                           |
| `ui-combobox__description`        | slot      |                                            | Help text.                                                |
| `ui-combobox__error`              | slot      |                                            | Error message while invalid.                              |
| `ui-combobox__popover`            | slot      |                                            | The list's floating surface.                              |
| `ui-combobox__listbox`            | slot      |                                            | The `role="listbox"` list.                                |
| `ui-combobox__section`            | slot      |                                            | A group of options.                                       |
| `ui-combobox__section-header`     | slot      |                                            | A section title.                                          |
| `ui-combobox__option`             | slot      |                                            | One `role="option"` row.                                  |
| `ui-combobox__option-icon`        | slot      |                                            | An option's icon (also `ui-icon`).                        |
| `ui-combobox__option-label`       | slot      |                                            | An option's label.                                        |
| `ui-combobox__option-description` | slot      |                                            | An option's secondary text.                               |
| `ui-combobox__empty`              | slot      |                                            | The empty-list message.                                   |
| `data-variant`                    | attribute | `default`, `search`                        | Variant.                                                  |
| `data-size`                       | attribute | `sm`, `md`, `lg`                           | Field size.                                               |
| `data-layer`                      | attribute | `dropdown`                                 | The popover's overlay layer.                              |
| `data-pending`                    | state     | `true`                                     | Suggestions are loading.                                  |
| `data-focused`                    | state     | `true`                                     | Focused (React Aria; root, input and highlighted option). |
| `data-open`                       | state     | `true`                                     | The list is open.                                         |
| `data-disabled`                   | state     | `true`                                     | Disabled (root, field, input, button, option).            |
| `data-readonly`                   | state     | `true`                                     | Read-only (root).                                         |
| `data-invalid`                    | state     | `true`                                     | Invalid (root, field and input).                          |
| `data-required`                   | state     | `true`                                     | Required.                                                 |
| `data-hovered`                    | state     | `true`                                     | Pointer over the field, input, button or option.          |
| `data-focus-within`               | state     | `true`                                     | Focus inside the field.                                   |
| `data-focus-visible`              | state     | `true`                                     | Keyboard focus.                                           |
| `data-pressed`                    | state     | `true`                                     | The button while the list is open, or a pressed option.   |
| `data-selected`                   | state     | `true`                                     | The chosen option.                                        |
| `data-selection-mode`             | state     | `single`                                   | Selection of the options.                                 |
| `data-placement`                  | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the field the popover opened on.                  |
| `data-trigger`                    | state     | `ComboBox`                                 | What opened the popover (React Aria).                     |
| `data-entering`                   | state     | `true`                                     | Popover entry animation.                                  |
| `data-exiting`                    | state     | `true`                                     | Popover exit animation.                                   |
| `data-empty`                      | state     | `true`                                     | The list has no options.                                  |
| `data-collection`                 | state     |                                            | React Aria's collection marker, on the list and options.  |
| `data-key`                        | state     |                                            | An option's `id` (React Aria).                            |
| `data-layout`                     | state     | `stack`                                    | Listbox layout (React Aria).                              |
| `data-orientation`                | state     | `vertical`                                 | Listbox orientation (React Aria).                         |
