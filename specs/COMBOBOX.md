# Combobox

`Combobox` is a text input with a list of suggestions, built on React Aria's `ComboBox`, `Label`, `Group`, `Input`, `Button`, `Popover` and `ListBox`. The reader types freely (with `allowsCustomValue`) or completes the text from the list, and may pick several options, shown as chips in a [Tag Group](TAG-GROUP.md). The combobox filters its own suggestions (`defaultItems`), or the caller filters them, synchronously or asynchronously, from `onInputChange` (`items`). Long lists render virtualized and load more as they scroll ([COLLECTIONS.md](COLLECTIONS.md)); typed text can add a new option, highlight its matches, complete itself inline, and keep the first match highlighted. React Aria provides the roles, the virtual focus in the list and the keyboard behaviour; the combobox declares its own props and hands them to it.

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

With `defaultItems`, the combobox shall show the options whose label contains the typed text, ignoring case, and drop sections left empty. With `items`, it shows exactly the given suggestions, so the caller filters them, for example after fetching them from `onInputChange` while `isPending`. The typed text is held by `inputValue` (controlled) or `defaultInputValue`, and every change of it calls `onInputChange` with the text.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.3 - Opening

The list shall open in the `dropdown` layer as the reader types (`menuTrigger="input"`, the default), on focus (`focus`) or only on Arrow Down, Arrow Up or the button (`manual`); Arrow Down and Arrow Up open it from the input and the button toggles it. It closes when the input loses focus or a scroll container of the field scrolls.

Implementation: `src/components/combobox/combobox.tsx`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.4 - Keyboard and picking

While the list is open, focus shall stay in the input: Arrow Down and Arrow Up move the highlighted option (the input's `aria-activedescendant`, `data-focused` on the option) and pass over disabled options; Enter or a press picks the option, writes its label to the input, calls `onChange` with its `id` (the value, with `defaultValue` and the controlled `value`, is the picked `id` or `null`) and closes the list; Escape closes the list. A disabled option cannot be picked.

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

## UIC-COMBOBOX-3 - Picking and entering

### UIC-COMBOBOX-3.1 - Multiple selection with chips

`selectionMode="multiple"` shall let the reader pick several options, with `value`, `defaultValue` and `onChange` holding the list of ids: picking an option toggles it, keeps the list open (`aria-multiselectable` on the listbox) and clears the typed text. The chosen options shall show, in value order, as chips in the library's `TagGroup` (`ui-combobox__chips`, also `ui-tag-group`, sized like the field) at the start of the field group, named by the provider's `selectedValues` string from the label text (or `aria-label`). A chip shows its option's label, or the label it had when last listed if the suggestions no longer list it, or its id. On an editable combobox each chip offers the tag group's remove button, and Delete or Backspace on a focused chip removes it; a disabled or read-only one offers no removal. React Aria hides everything but the input and the list from assistive technology while the list is open.

Implementation: `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-chips.tsx`, `src/components/combobox/combobox-field.tsx`
Verification: `src/components/combobox/combobox-chips.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-3.2 - Adding an option

`onCreateOption` shall end the options, while the trimmed typed text is not empty and no option has it as its label (ignoring case), with an action row (`ui-combobox__create`, `role="option"`) reading the provider's `createOption` string with the text ("Add “Kiwi”"). Enter on the highlighted row or a press on it shall call `onCreateOption` with the text and close the list without selecting anything; the caller adds the option, and may select it.

Implementation: `src/components/combobox/combobox-suggestions.tsx`, `src/components/combobox/combobox.tsx`, `src/core/field-strings.ts`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-3.3 - Highlighting the first match

With `autoHighlight`, while the list is open and no option is highlighted, the first enabled option (or the add row when nothing else matches) shall be highlighted after each change of the text, so Enter or Tab picks it. Arrow Down and Arrow Up move the highlight from there.

Implementation: `src/components/combobox/combobox-effects.ts`, `src/components/combobox/combobox-options.ts`
Verification: `src/components/combobox/combobox-field.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-3.4 - Inline completion

With `completesInline`, typing that inserts text shall complete it in the input with the rest of the label of the first enabled option, in list order, whose label starts with the typed text (ignoring case), keeping the typed characters as typed and selecting the added part, so the next keystroke replaces it; that option is highlighted, so Enter or Tab picks it. Deleting text never completes it again until the next insertion, and text composition is left alone. The list stays filtered by the typed text rather than the completion; the input publishes `aria-autocomplete="both"`.

Implementation: `src/components/combobox/combobox-field.tsx`, `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-effects.ts`, `src/components/combobox/combobox-options.ts`
Verification: `src/components/combobox/combobox-field.test.tsx`, `e2e/combobox.spec.ts`

## UIC-COMBOBOX-4 - Long lists and option content

### UIC-COMBOBOX-4.1 - Virtualized list

With `virtualized`, the listbox shall render inside a React Aria `Virtualizer` with a `ListLayout` ([UIC-COLLECTIONS-1.1](COLLECTIONS.md#uic-collections-11---virtualized-rendering)) that measures each row, drawing only the options in view of the listbox, positioned absolutely, while the keyboard reaches every option and each keeps its hooks, `aria-setsize` and `aria-posinset`. Filtering, sections, the add row and the loading row work the same.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-4.2 - Loading more

`onLoadMore` or `isLoading` shall end the list with React Aria's `ListBoxLoadMoreItem` ([UIC-COLLECTIONS-1.2](COLLECTIONS.md#uic-collections-12---loading-more-inside-a-collection)), which calls `onLoadMore` when it scrolls into the list's view while `isLoading` is false; while `isLoading`, it draws a row (`ui-combobox__load-more`) reading the provider's `loading` string, alone in place of the empty state when no option is listed. `isPending` still marks the field busy while the first suggestions load.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-4.3 - Match highlighting

With `highlightMatches`, each option label shall mark the terms of the typed text (not an inline completion) with [Text Match](TEXT-MATCH.md) marks (`ui-text-match`), ignoring case and accents.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-4.4 - Custom option content

`renderOption(option, state)` shall draw the content of each option row instead of its icon, label and description, receiving the option and the row's state (`ComboboxOptionState`: `isFocused`, `isFocusVisible`, `isSelected`, `isHovered`, `isPressed` and `isDisabled`). The row keeps its `option` role, its hook and its label as the text that the filter matches and the input shows once picked.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

## Hooks

| Hook                              | Kind      | Values                                     | Description                                                         |
| --------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `ui-combobox`                     | root      |                                            | The combobox wrapper.                                               |
| `ui-combobox__label`              | slot      |                                            | The visible label.                                                  |
| `ui-combobox__field`              | slot      |                                            | The group framing the input and its buttons.                        |
| `ui-combobox__search-icon`        | slot      |                                            | Leading search glyph of the `search` variant.                       |
| `ui-combobox__input`              | slot      |                                            | The text input (`role="combobox"`).                                 |
| `ui-combobox__spinner`            | slot      |                                            | Busy indicator while pending.                                       |
| `ui-combobox__clear`              | slot      |                                            | The clear button (also `ui-icon-button`).                           |
| `ui-combobox__button`             | slot      |                                            | The button that opens the list.                                     |
| `ui-combobox__description`        | slot      |                                            | Help text.                                                          |
| `ui-combobox__error`              | slot      |                                            | Error message while invalid.                                        |
| `ui-combobox__popover`            | slot      |                                            | The list's floating surface.                                        |
| `ui-combobox__listbox`            | slot      |                                            | The `role="listbox"` list.                                          |
| `ui-combobox__section`            | slot      |                                            | A group of options.                                                 |
| `ui-combobox__section-header`     | slot      |                                            | A section title.                                                    |
| `ui-combobox__option`             | slot      |                                            | One `role="option"` row.                                            |
| `ui-combobox__option-icon`        | slot      |                                            | An option's icon (also `ui-icon`).                                  |
| `ui-combobox__option-label`       | slot      |                                            | An option's label.                                                  |
| `ui-combobox__option-description` | slot      |                                            | An option's secondary text.                                         |
| `ui-combobox__empty`              | slot      |                                            | The empty-list message.                                             |
| `ui-combobox__chips`              | slot      |                                            | The tag group of a multiple combobox's chips (also `ui-tag-group`). |
| `ui-combobox__create`             | slot      |                                            | The action row that adds the typed text as an option.               |
| `ui-combobox__load-more`          | slot      |                                            | The loading row at the end of the list.                             |
| `data-variant`                    | attribute | `default`, `search`                        | Variant.                                                            |
| `data-size`                       | attribute | `sm`, `md`, `lg`                           | Field size.                                                         |
| `data-layer`                      | attribute | `dropdown`                                 | The popover's overlay layer.                                        |
| `data-pending`                    | state     | `true`                                     | Suggestions are loading.                                            |
| `data-focused`                    | state     | `true`                                     | Focused (React Aria; root, input and highlighted option).           |
| `data-open`                       | state     | `true`                                     | The list is open.                                                   |
| `data-disabled`                   | state     | `true`                                     | Disabled (root, field, input, button, option).                      |
| `data-readonly`                   | state     | `true`                                     | Read-only (root).                                                   |
| `data-invalid`                    | state     | `true`                                     | Invalid (root, field and input).                                    |
| `data-required`                   | state     | `true`                                     | Required.                                                           |
| `data-hovered`                    | state     | `true`                                     | Pointer over the field, input, button or option.                    |
| `data-focus-within`               | state     | `true`                                     | Focus inside the field.                                             |
| `data-focus-visible`              | state     | `true`                                     | Keyboard focus.                                                     |
| `data-pressed`                    | state     | `true`                                     | The button while the list is open, or a pressed option.             |
| `data-selected`                   | state     | `true`                                     | The chosen option.                                                  |
| `data-selection-mode`             | state     | `single`, `multiple`                       | Selection of the options.                                           |
| `data-placement`                  | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the field the popover opened on.                            |
| `data-trigger`                    | state     | `ComboBox`                                 | What opened the popover (React Aria).                               |
| `data-entering`                   | state     | `true`                                     | Popover entry animation.                                            |
| `data-exiting`                    | state     | `true`                                     | Popover exit animation.                                             |
| `data-empty`                      | state     | `true`                                     | The list has no options.                                            |
| `data-collection`                 | state     |                                            | React Aria's collection marker, on the list and options.            |
| `data-key`                        | state     |                                            | An option's `id` (React Aria).                                      |
| `data-layout`                     | state     | `stack`                                    | Listbox layout (React Aria).                                        |
| `data-orientation`                | state     | `vertical`                                 | Listbox orientation (React Aria).                                   |
