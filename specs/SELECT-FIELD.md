# Select Field

`SelectField` chooses one value, or several, from a list the caller defines. It is a field control: it composes the field base ([FIELD.md](FIELD.md)) for its label, layout, description, help, validation, dirty state, restore, undo and menu, around React Aria's `Select`, `ListBox` and, for filterable lists, `Autocomplete` and `SearchField`. The closed field is a framed trigger showing the chosen option (its icon and label) or a placeholder; the options open in a popover. A multiple select keeps its trigger and shows its choices as removable chips below it (React Aria `TagGroup`). Options may be grouped under headings, drawn by the caller and virtualized for very long lists. Long lists filter inside the open list, and `loadOptions` replaces the local filter with the caller's asynchronous search, page by page as the list scrolls. A clear button and a maximum number of values are optional. A select commits only values its options define; a list whose typed text may itself become the value is a [Combobox](COMBOBOX.md). The [Boolean Field](BOOLEAN-FIELD.md)'s `dropdown` variant draws the same control, bound to its own field state.

## UIC-SELECT-FIELD-1 - Field

### UIC-SELECT-FIELD-1.1 - Structure

`SelectField` shall render a `Field` whose root also carries `ui-select-field` and publishes `data-selection-mode` (`single` by default, or `multiple`). Its control is React Aria's `Select` (`ui-select-field__select`) holding a frame (`ui-select-field__frame`) around the trigger button (`ui-select-field__trigger`), which carries the control's id, opens a listbox (`aria-haspopup="listbox"`, `aria-expanded`) and is named by its value element (`ui-select-field__value`) followed by the field's label. The field's description, decoration and message describe the trigger.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`, `src/components/select-field/select-trigger.tsx`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-1.2 - Value and commit

A single select's value shall be the chosen option's `id` or `null`; a multiple select's is the list of chosen ids in the options' order, without repeats, ids no option names keeping their place after the others. The field takes `value` with `onChange` or holds the value itself from `committedValue` or `defaultValue`, and every pick, chip removal and value restore sets the value and commits it at once, so `onCommit` hears each change. Numeric and text keys with the same spelling remain distinct in options, chips and callbacks, while form inputs submit the original key text. A single value of `''` stands for no value, as a native select's empty option does (the form submits it empty and a required field reports it missing), but while an option has the id `''` the trigger shows that option as the choice.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`, `src/components/select-field/select-options.ts`
Verification: `src/components/select-field/select-field.test.tsx`, `src/components/select-field/select-options.test.ts`

### UIC-SELECT-FIELD-1.3 - Validation and states

The field base's validation shall apply (a required field without a value is invalid, then `validate`, `isPending`), and an invalid select marks its React Aria `Select` invalid (`data-invalid`). A disabled select disables its trigger and keeps its list closed, including an explicitly open list. A read-only select keeps its trigger focusable and its value visible, never opens its list and offers no chip removal.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/select-chips.tsx`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-1.4 - Restore, undo and menu

The field base's restore button, undo and redo chords and field menu shall apply to the select's value: Clear sets `null` for a single select and an empty list for a multiple select (the default `emptyValue`), and Set to default sets `defaultValue`.

Implementation: `src/components/select-field/select-field.tsx`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-1.5 - Hooks and caller attributes

`SelectField` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to the field root, and use `name` for its form inputs, and pass `autoFocus`, `isOpen`, `defaultOpen` and `onOpenChange` to React Aria's `Select`.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-field.test.tsx`

## UIC-SELECT-FIELD-2 - Trigger

### UIC-SELECT-FIELD-2.1 - Summary

A single select's trigger shall show the chosen option's icon (`ui-select-field__value-icon`) and label (`ui-select-field__value-label`) inside its value element. Without a choice it shows `placeholder` (by default the provider string `selectPlaceholder`) and the value element publishes `data-placeholder`. A chosen id that no option names shows as itself, with `data-missing`. A multiple select's trigger shows the provider string `selectedCount` for its choices (`2 selected`), so it reads as its choices and the field's label, or the placeholder (with `data-placeholder`) while it has none. With `emptyLabel`, a single select lists a first option of that label which stands for no value: the trigger shows it while the value is `null`, and picking it commits `null`. The trigger ends with a chevron glyph (`ui-select-field__chevron`).

Implementation: `src/components/select-field/select-trigger.tsx`, `src/components/select-field/select-control.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-2.2 - Width

The select shall measure the widest of its options' labels, its placeholder (or empty label) and, for a multiple select, the `selectedCount` text for all its options in the trigger's font on a canvas and publish it, in pixels, as `--ui-select-field-label-width` on `ui-select-field__select`; its root publishes `data-icons` when any option has an icon. It measures once per set of labels and again when the document's fonts finish loading; opening, filtering and search results never change it. The reference sheet sizes the trigger to that width plus its padding, chevron and, with `data-icons`, an icon, capped at the width of the field's control slot, so the trigger keeps its width as the choice changes.

Implementation: `src/utils/use-widest-text-width.ts`, `src/components/select-field/select-control.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-2.3 - Previous value

While a single select is dirty and its committed value had a choice, the frame shall show that committed option (icon and label) as a `FieldPreviousValue` (`ui-select-field__previous`) before the trigger. The previous value stays outside the trigger button, so the trigger's accessible name and visible text remain its current value.

Implementation: `src/components/select-field/select-trigger.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-field.test.tsx`

## UIC-SELECT-FIELD-3 - List

### UIC-SELECT-FIELD-3.1 - Opening

Pressing the trigger, or Enter, Space, Arrow Down or Arrow Up on it, shall open the options in a popover (`ui-select-field__popover`) anchored below the trigger on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')`, and publishing the trigger's width as `--ui-trigger-width`. React Aria keeps focus in the list, moves it to the chosen option, locks page scrolling while the list is open, and closes the list on Escape or a press outside it. `isOpen`, `defaultOpen` and `onOpenChange` control the open state.

Implementation: `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.2 - Options

Each option shall be a `role="option"` row (`ui-select-field__option`) drawing its icon (`ui-select-field__option-icon`), its label (`ui-select-field__option-label`) and its description (`ui-select-field__option-description`), named by its label and description text. A disabled option stays listed but cannot be picked by pointer or keyboard, and the arrow keys pass over it.

Implementation: `src/components/select-field/select-list.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.3 - Single choice

In a single select, picking an option shall replace the choice, commit it, close the list and return focus to the trigger.

Implementation: `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.4 - Multiple choice

In a multiple select, picking an option shall toggle it in the value and keep the list open. Every option draws a check slot (`ui-select-field__option-check`, hidden from assistive technology) holding the `check` glyph while it is chosen; the option's `aria-selected` carries the state.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/select-list.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.5 - Filtering

A filterable select (`filterable`, on by default for more than 10 options or with `loadOptions`) shall lead its open list with a search field (`ui-select-field__search`, input `ui-select-field__search-input`, named by the provider string `search`) that takes focus without selecting its text. Typing narrows the options to those whose label or description contains the text, ignoring case and accents, while the arrow keys move through the remaining options and Enter picks one; filtering never changes the value. When no option is listed, the list shows the provider string `noResults` in `ui-select-field__empty`. Closing the list clears the filter. A list that is not filterable draws no search field.

Implementation: `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.6 - Typing on the closed trigger

A printable key (other than Space) pressed on the closed trigger of a filterable, editable select shall open the list with the filter holding that key, without changing the value. A select that is not filterable keeps React Aria's type-to-select on the trigger.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/select-trigger.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-4 - Chips

### UIC-SELECT-FIELD-4.1 - Chosen values

A multiple select shall show each chosen option, in value order, as a chip (`ui-select-field__chip`, with `ui-select-field__chip-icon` and `ui-select-field__chip-label`) in a React Aria tag group (`ui-select-field__chips`, list `ui-select-field__chip-list`) after the select, named by the provider string `selectedValues` from the field's label. A chip of an id no option names publishes `data-missing`. The arrow keys move between chips.

Implementation: `src/components/select-field/select-chips.tsx`
Verification: `src/components/select-field/select-chips.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-4.2 - Removing a chip

On an editable select each chip shall end with a remove button (`ui-select-field__chip-remove`, an `Button` with the `close` glyph named by the provider string `remove` read with the chip's label); pressing it, or Delete or Backspace on a focused chip, removes that value and commits without opening the list. A read-only or disabled select's chips stay focusable and offer no removal.

Implementation: `src/components/select-field/select-chips.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-chips.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-4.3 - Changes against the committed value

While a multiple select is dirty, the chips of values the edit added shall publish `data-change="added"`, and each committed value the edit removed shall follow the chips as a `FieldPreviousValue` (`ui-select-field__removed`) whose restore button (`Restore <label>`) puts that one value back and commits.

Implementation: `src/components/select-field/select-chips.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-chips.test.tsx`, `src/components/select-field/select-options.test.ts`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-5 - Search

### UIC-SELECT-FIELD-5.1 - Loading options

With `loadOptions(query, signal)`, the select shall call it with the trimmed filter text once the text is at least `minSearchLength` characters long (1 by default) and `searchDelay` milliseconds (240 by default) have passed since the last keystroke, abort the signal of a search a newer one replaces, and list the chosen options followed by the latest results, unfiltered.

Implementation: `src/components/select-field/select-search.ts`, `src/components/select-field/select-control.tsx`, `src/utils/use-remote-search.ts`
Verification: `src/components/select-field/select-search.test.tsx`, `src/components/select-field/select-options.test.ts`

### UIC-SELECT-FIELD-5.2 - Search status

While a search runs, a status line (`ui-select-field__loading`, `role="status"`, provider string `loading`) shall lead the results it will replace. An empty list says, in order of precedence, `loading` while searching, `searchFailed` after a failed search, `typeToSearch` while the text is too short, and otherwise `noResults`.

Implementation: `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-search.test.tsx`

### UIC-SELECT-FIELD-5.3 - Remembered options

Every option a search returns shall stay known while the field is mounted, so a chosen searched option keeps its label and icon in the trigger and on its chip after later results no longer include it.

Implementation: `src/components/select-field/select-search.ts`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-search.test.tsx`

### UIC-SELECT-FIELD-5.4 - Paged results

`loadOptions` may return a page, `{ options, cursor }`, instead of a list. While the latest results have a `cursor`, the list shall end with React Aria's load-more row (`ui-select-field__load-more`); when it scrolls into view the select calls `loadOptions(query, signal, cursor)` without waiting for `searchDelay`, appends that page's options (remembered as in UIC-SELECT-FIELD-5.3) and, while the page loads, shows the provider string `loading` in the row. A page without a `cursor` ends the list. A first page is asked for with the query and signal alone, and a loader that returns a list has one page.

Implementation: `src/components/select-field/select-search.ts`, `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-search.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-6 - Forms

### UIC-SELECT-FIELD-6.1 - Form values

With `name`, the select shall publish its chosen ids to its form through hidden inputs: one entry for a single select's choice and one per chosen id for a multiple select. A single select showing its `emptyLabel` option publishes one empty entry, as a native select's empty option does, never that option's generated key.

Implementation: `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-field.test.tsx`

## UIC-SELECT-FIELD-7 - Groups, option content and long lists

### UIC-SELECT-FIELD-7.1 - Option groups

`options` may hold groups, `{ id, label, options }`, among plain options. Each group shall render, in order, as a React Aria section (`ui-select-field__section`, `role="group"`) led by its `label` in a heading (`ui-select-field__section-header`) that names the group, and holding its options; a group without a `label` is a section without a heading, which the reference sheet sets apart from its neighbours with a rule. Grouped options take part like any other in the value order, the measured width, the arrow keys and the filter, which hides a section none of whose options match. Group ids must differ from option ids.

Implementation: `src/components/select-field/select-option.tsx`, `src/components/select-field/select-options.ts`, `src/components/select-field/select-list.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-option.test.tsx`, `src/components/select-field/select-options.test.ts`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-7.2 - Custom option content

`renderOption(option, state)` shall draw the content of each option row instead of its icon, label and description, receiving the option and the row's state (`SelectFieldOptionState`: `isSelected`, `isFocused`, `isFocusVisible`, `isHovered`, `isPressed` and `isDisabled`). The row keeps its `option` role, its check slot in a multiple select and its label as the text that type-to-select and the filter match; the trigger and the chips keep drawing the option's icon and label.

Implementation: `src/components/select-field/select-option.tsx`
Verification: `src/components/select-field/select-option.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-7.3 - Virtualized list

With `virtualized`, the list shall render through React Aria's `Virtualizer` with a list layout: only the options in and near view are in the document, placed by the virtualizer's inline offsets, and scrolling or moving focus with the arrow keys, Home and End brings the others in. Every list keeps each option's row while the option and the way rows are drawn stay the same, so typing in the filter of a long list draws no unchanged row again. The reference sheet caps the listbox's height so it scrolls.

Implementation: `src/components/select-field/select-list.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-8 - Clearing and limits

### UIC-SELECT-FIELD-8.1 - Clear button

With `isClearable`, while the field can be cleared (editable, not required and holding a value, UIC-FIELD-2.5) the frame shall end with a clear button (`ui-select-field__clear`, an `Button` with the `close` glyph named by the provider string `clearValue` from the label, `Clear Fruit`) outside the trigger. Pressing it sets the empty value (`null`, or an empty list for a multiple select) and commits it without opening the list, then moves focus to the trigger.

Implementation: `src/components/select-field/select-trigger.tsx`, `src/components/select-field/select-control.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-trigger.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-8.2 - Maximum values

`maxValues` shall cap a multiple select's value: once it holds that many values, every option it has not chosen is disabled (`aria-disabled`, passed over by the arrow keys and refusing a press) and the restore buttons of removed committed values are disabled, until a value is removed. A single select ignores it.

Implementation: `src/components/select-field/select-model.ts`, `src/components/select-field/select-option.tsx`, `src/components/select-field/select-chips.tsx`
Verification: `src/components/select-field/select-model.test.tsx`, `e2e/select-field.spec.ts`

## Hooks

| Hook                                  | Kind      | Values                                     | Description                                                              |
| ------------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `ui-select-field`                     | root      |                                            | The field root (also `ui-field`).                                        |
| `ui-select-field__select`             | slot      |                                            | React Aria's select wrapper; carries the measured label width.           |
| `ui-select-field__frame`              | slot      |                                            | Holds the previous value and the trigger.                                |
| `ui-select-field__trigger`            | slot      |                                            | The trigger button.                                                      |
| `ui-select-field__clear`              | slot      |                                            | The clear button after the trigger (also `ui-button`).                   |
| `ui-select-field__previous`           | slot      |                                            | A single select's previous value (also `ui-field-previous-value`).       |
| `ui-select-field__value`              | slot      |                                            | The chosen option or the placeholder; names the trigger.                 |
| `ui-select-field__value-icon`         | slot      |                                            | The chosen (or previous) option's icon (also `ui-icon`).                 |
| `ui-select-field__value-label`        | slot      |                                            | The chosen option's label or the placeholder.                            |
| `ui-select-field__chevron`            | slot      |                                            | The trigger's chevron glyph.                                             |
| `ui-select-field__popover`            | slot      |                                            | The list's floating surface.                                             |
| `--ui-trigger-width`                  | property  |                                            | Width of the element the popover opens from, in pixels.                  |
| `ui-select-field__loading`            | slot      |                                            | The status line of a running search.                                     |
| `ui-select-field__search`             | slot      |                                            | The filter's search field.                                               |
| `ui-select-field__search-input`       | slot      |                                            | The filter input.                                                        |
| `ui-select-field__listbox`            | slot      |                                            | The `role="listbox"` list.                                               |
| `ui-select-field__section`            | slot      |                                            | A group of options (`role="group"`).                                     |
| `ui-select-field__section-header`     | slot      |                                            | A group's heading.                                                       |
| `ui-select-field__option`             | slot      |                                            | One `role="option"` row.                                                 |
| `ui-select-field__option-check`       | slot      |                                            | A multiple select's selection indicator.                                 |
| `ui-select-field__option-icon`        | slot      |                                            | An option's icon (also `ui-icon`).                                       |
| `ui-select-field__option-label`       | slot      |                                            | An option's label.                                                       |
| `ui-select-field__option-description` | slot      |                                            | An option's description.                                                 |
| `ui-select-field__empty`              | slot      |                                            | The empty-list message.                                                  |
| `ui-select-field__load-more`          | slot      |                                            | The row that loads the next page of results, showing the loading text.   |
| `ui-select-field__chips`              | slot      |                                            | The tag group of a multiple select's chips.                              |
| `ui-select-field__chip-list`          | slot      |                                            | The list of chips.                                                       |
| `ui-select-field__chip`               | slot      |                                            | One chosen value.                                                        |
| `ui-select-field__chip-icon`          | slot      |                                            | A chip's or removed value's icon (also `ui-icon`).                       |
| `ui-select-field__chip-label`         | slot      |                                            | A chip's label.                                                          |
| `ui-select-field__chip-remove`        | slot      |                                            | A chip's remove button (also `ui-button`).                               |
| `ui-select-field__removed`            | slot      |                                            | A removed committed value (also `ui-field-previous-value`).              |
| `data-selection-mode`                 | attribute | `single`, `multiple`                       | On the root (and React Aria's options): how many values the field takes. |
| `data-layer`                          | attribute | `dropdown`                                 | The popover's overlay layer.                                             |
| `--ui-select-field-label-width`       | property  |                                            | The widest option label or placeholder, in pixels.                       |
| `data-icons`                          | state     | `true`                                     | On the root: some option has an icon.                                    |
| `data-placeholder`                    | state     | `true`                                     | On the value: nothing is chosen.                                         |
| `data-missing`                        | state     | `true`                                     | On the value or a chip: no option names the chosen id.                   |
| `data-change`                         | state     | `added`                                    | On a chip: the edit added this value.                                    |
| `data-open`                           | state     | `true`                                     | The list is open (React Aria, on the select).                            |
| `data-focused`                        | state     | `true`                                     | Focused (React Aria).                                                    |
| `data-focus-visible`                  | state     | `true`                                     | Keyboard focus (React Aria).                                             |
| `data-focus-within`                   | state     | `true`                                     | Focus inside (React Aria).                                               |
| `data-hovered`                        | state     | `true`                                     | Pointer over the element (React Aria).                                   |
| `data-pressed`                        | state     | `true`                                     | Pressed (React Aria).                                                    |
| `data-disabled`                       | state     | `true`                                     | Disabled (React Aria).                                                   |
| `data-invalid`                        | state     | `true`                                     | Invalid (React Aria, on the select and search field).                    |
| `data-required`                       | state     | `true`                                     | Required (React Aria, on the select).                                    |
| `data-selected`                       | state     | `true`                                     | A chosen option (React Aria).                                            |
| `data-empty`                          | state     | `true`                                     | An empty list or filter (React Aria).                                    |
| `data-allows-removing`                | state     | `true`                                     | A removable chip (React Aria).                                           |
| `data-placement`                      | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the trigger the popover opened on (React Aria).                  |
| `data-trigger`                        | state     | `Select`                                   | What opened the popover (React Aria).                                    |
| `data-entering`                       | state     | `true`                                     | Popover entry animation (React Aria).                                    |
| `data-exiting`                        | state     | `true`                                     | Popover exit animation (React Aria).                                     |
| `data-collection`                     | state     |                                            | React Aria's collection marker.                                          |
| `data-key`                            | state     |                                            | Opaque collection key (React Aria): not the `id`, not for styling.       |
| `data-layout`                         | state     | `stack`                                    | Listbox layout (React Aria).                                             |
| `data-orientation`                    | state     | `vertical`                                 | Listbox orientation (React Aria).                                        |
