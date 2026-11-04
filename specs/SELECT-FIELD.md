# Select Field

`SelectField` chooses one or several values, with `selectionMode="single"` or `"multiple"`. `mode="list"` (the default) accepts flat icon/text options and headed groups through `options`; `mode="tree"` accepts hierarchical `items`, text and child accessors, lazy loading, selection propagation and label/path display. Both modes provide the field's validation, dirty state, restore, undo, forms and menu. Icons belong to ordinary options.

## UIC-SELECT-FIELD-1 - Field

### UIC-SELECT-FIELD-1.1 - Structure

`SelectField` shall render a `Field` whose root also carries `ui-select-field` and publishes `data-selection-mode` (`single` by default, or `multiple`). Its control is React Aria's `Select` (`ui-select-field__select`) holding a frame (`ui-select-field__frame`) around the trigger button (`ui-select-field__trigger`), which carries the control's id, opens a listbox (`aria-haspopup="listbox"`, `aria-expanded`) and is named by its value element (`ui-select-field__value`) followed by the field's label. The field's description, decoration and message describe the trigger.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`, `src/components/select-field/select-trigger.tsx`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-1.2 - Value and commit

A single select's value shall be the chosen option's `id` or `null`; a multiple select's is the list of chosen ids in the options' order, without repeats, ids no option names keeping their place after the others. The field takes `value` with `onChange` or holds the value itself from `committedValue` or `defaultValue`, and every pick, chip removal and value restore sets the value and commits it at once, so `onCommit` hears each change. Numeric and text keys with the same spelling remain distinct in options, chips and callbacks, while form inputs submit the original key text. A single value of `''` stands for no value, as a native select's empty option does (the form submits it empty and a required field reports it missing), but while an option of `options` has the id `''` that option is the choice: the trigger shows it, the field is filled and it satisfies a required field.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`, `src/components/select-field/select-options.ts`
Verification: `src/components/select-field/select-field.test.tsx`, `src/components/select-field/select-options.test.ts`

### UIC-SELECT-FIELD-1.3 - Validation and states

The field base's validation shall apply (a required field without a value is invalid, then `validate`, `isPending`), and an invalid select marks its React Aria `Select` invalid (`data-invalid`). A disabled select disables its trigger and keeps its list closed, including an explicitly open list. An open list whose select turns disabled or read-only closes through the ordinary close (`onOpenChange(false)`, the filter cleared), so it stays closed once the select unlocks; in tree mode the popover does the same. A read-only select keeps its trigger focusable and its value visible, never opens its list and offers no chip removal.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/select-chips.tsx`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-1.4 - Restore, undo and menu

The field base's restore button, undo and redo chords and field menu shall apply to the select's value: Clear sets `null` for a single select and an empty list for a multiple select (the default `emptyValue`), and Set to default sets `defaultValue`.

Implementation: `src/components/select-field/select-field.tsx`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-1.5 - Hooks and caller attributes

`SelectField` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to the field root, and use `name` for its form inputs, focus its trigger on mount with `autoFocus`, which the field handles (UIC-FIELD-8.3), and pass `isOpen`, `defaultOpen` and `onOpenChange` to React Aria's `Select`.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-field.test.tsx`

## UIC-SELECT-FIELD-2 - Trigger

### UIC-SELECT-FIELD-2.1 - Summary

A single select's trigger shall show the chosen option's icon (`ui-select-field__value-icon`) and label (`ui-select-field__value-label`) inside its value element. Without a choice it shows `placeholder` (by default the provider string `selectPlaceholder`) and the value element publishes `data-placeholder`. A chosen id that no option names shows as itself, with `data-missing`. A multiple select's trigger shows the provider string `selectedCount` for its choices (`2 selected`), so it reads as its choices and the field's label, or the placeholder (with `data-placeholder`) while it has none. With `emptyLabel`, a single select lists a first option of that label which stands for no value: the trigger shows it while the value is `null`, and picking it commits `null`. The trigger ends with a chevron glyph (`ui-select-field__chevron`).

Implementation: `src/components/select-field/select-trigger.tsx`, `src/components/select-field/select-control.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-2.2 - Width

The select shall measure the widest of its options' labels, its placeholder (or empty label) and, for a multiple select, the `selectedCount` text for all its options in the trigger's font on a canvas and publish it, in pixels, as `--ui-select-field-label-width` on `ui-select-field__select`; its root publishes `data-icons` when any option has an icon. It measures once per set of labels and again when the document's fonts finish loading; opening, filtering and search results never change it. The value label is a [Truncation Tooltip](TRUNCATION-TOOLTIP.md): when the stylesheet cuts its current choice, summary or placeholder short, hover or keyboard focus shows the complete text without opening the list; Escape dismisses that hint. The reference sheet sizes the trigger to that width plus its padding, chevron and, with `data-icons`, an icon, capped at the width of the field's control slot, so the trigger keeps its width as the choice changes.

Implementation: `src/utils/use-widest-text-width.ts`, `src/components/select-field/select-control.tsx`, `src/components/select-field/select-trigger.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-field.test.tsx`, `src/components/select-field/select-trigger.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-2.3 - Previous value

While a single select is dirty and its committed value had a choice, the frame shall show that committed option (icon and label) as a `FieldPreviousValue` (`ui-select-field__previous`) before the trigger. The previous value stays outside the trigger button, so the trigger's accessible name and visible text remain its current value. A select whose committed value had no choice shows no previous value, and one whose edit chose nothing shows the previous value before the placeholder. The field's `changeLayout` (UIC-FIELD-1.13) places it: `inline` before the trigger on its row, `stacked` on its own line above the trigger, and `hidden` draws neither it nor the removed values; a multiple select's chips and removed values (UIC-SELECT-FIELD-4.3) keep their rows below the trigger in both. Each removed value's restore button puts back that one value, while the field's restore button and the menu's Reset put back the whole committed value.

Implementation: `src/components/select-field/select-trigger.tsx`, `src/components/select-field/select-control.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-field.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-2.4 - Trigger ref

`triggerRef` shall receive the trigger button, the field's focusable control, in list and tree mode, joined to the field's own ref: object and callback refs both work, it receives `null` (or runs its cleanup) when the trigger leaves, and a re-render with the same ref does not re-attach it. A caller can restore focus to the trigger through it.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/tree-select-trigger.tsx`
Verification: `src/components/select-field/select-trigger.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-3 - List

### UIC-SELECT-FIELD-3.1 - Opening

Pressing the trigger, or Enter, Space, Arrow Down or Arrow Up on it, shall open the options in a popover (`ui-select-field__popover`) anchored below the trigger on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')`, and publishing the trigger's width as `--ui-trigger-width`. React Aria keeps focus in the list, moves it to the chosen option, locks page scrolling while the list is open, and closes the list on Escape or a press outside it. One Escape in a nonempty filter closes the list, clears the filter, returns focus to the trigger and retains the value, without closing an enclosing modal; a composing Escape remains with the input method. `isOpen`, `defaultOpen` and `onOpenChange` control the open state. Opening a multiple list never edits its value: releasing the trigger's opening pointer press over an option leaves the value, callbacks and memberships unchanged; selecting an option requires a fresh press on it or a selection key.

Implementation: `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `src/components/select-field/select-escape.test.tsx`, `src/components/select-field/select-indeterminate.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.2 - Options

Options and groups extend the shared picker vocabulary (`PickerOption`, `PickerSection`, [UIC-FIELD-11.1](FIELD.md#uic-field-111---picker-vocabulary)) through `SelectFieldOption` and `SelectFieldGroup`. Each option shall be a `role="option"` row (`ui-select-field__option`) drawing its icon (`ui-select-field__option-icon`), its label (`ui-select-field__option-label`) and its description (`ui-select-field__option-description`), named by its label and description text. A disabled option stays listed but cannot be picked by pointer or keyboard, and the arrow keys pass over it.

Implementation: `src/components/select-field/select-list.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.3 - Single choice

In a single select, picking an option shall replace the choice, commit it, close the list and return focus to the trigger.

Implementation: `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.4 - Multiple choice

In a multiple select, picking an option shall toggle it in the value and keep the list open. Every option draws a check slot (`ui-select-field__option-check`, hidden from assistive technology) holding the `check` glyph while it is chosen; the option's `aria-selected` carries the state.

With `isMixed`, a multiple select shall show its placeholder in place of its selected count, chips and removed-value preview. Its value remains authoritative for list selection, callbacks and form submission, including values shared by every record. The host owns when mixed values become uniform and clears `isMixed` to restore the normal summary. A single select ignores `isMixed`.

Changing selection or mixed-option metadata shall leave every description ID reference valid; a chosen or no-longer-mixed option shall announce no mixed-membership explanation.

`SelectFieldOption.isIndeterminate` shall mark an unchosen option in a multiple list as selected for some records: its check slot publishes `data-indeterminate="true"` and draws the `minus` glyph. React Aria's option description announces the provider string `selectOptionIndeterminate` (by default `Selected for some records`), including with custom option content, while the existing label and description remain its accessible name. Mixed membership alone never adds a value, chip, selected count or form input; `value` remains authoritative and a chosen option always draws a check, with no mixed hook or explanation. Single-select indicators ignore `isIndeterminate`. Flat options, grouped options and search results accept the property. Filtering, pointer and keyboard selection, limits and disabled behavior continue to use ordinary selection: picking a mixed option requests its id through `onChange` and `onCommit`. The host owns per-record memberships and any mixed → selected for all → removed for all → retain mixed cycle by updating `value` and option metadata; the component adds no membership state or custom selection callback.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/select-list.tsx`, `src/components/select-field/select-option.tsx`, `src/components/select-field/select-options.ts`
Verification: `src/components/select-field/select-list.test.tsx`, `src/components/select-field/select-option.test.tsx`, `src/components/select-field/select-indeterminate.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.5 - Filtering

A filterable select (`filterable`, on by default for more than 10 options or with `loadOptions`) shall lead its open list with a search field (`ui-select-field__search`, input `ui-select-field__search-input`, named by the provider string `search`) that takes focus without selecting its text. Typing narrows the options to those whose label or plain-text description contains the text, ignoring case and accents, while the arrow keys move through the remaining options and Enter picks one; filtering never changes the value. When no option is listed, the list shows the provider string `noResults` in `ui-select-field__empty`. Closing the list clears the filter. A list that is not filterable draws no search field.

Implementation: `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-3.6 - Typing on the closed trigger

A printable key (other than Space) pressed on the closed trigger of a filterable, editable select shall open the list with the filter holding that key, without changing the value. A key an input method composition owns (`isComposing`, or key code 229) is left to it. A select that is not filterable keeps React Aria's type-to-select on the trigger.

Implementation: `src/components/select-field/select-control.tsx`, `src/components/select-field/select-trigger.tsx`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-4 - Chips

### UIC-SELECT-FIELD-4.1 - Chosen values

A multiple select shall show each chosen option, in value order, as a chip (`ui-select-field__chip`, with `ui-select-field__chip-icon` and `ui-select-field__chip-label`) in a React Aria tag group (`ui-select-field__chips`, list `ui-select-field__chip-list`) after the select, named by the provider string `selectedValues` from the field's label. A chip of an id no option names publishes `data-missing`. The arrow keys move between chips.

Implementation: `src/components/select-field/select-chips.tsx`
Verification: `src/components/select-field/select-chips.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-4.2 - Removing a chip

On an editable select each chip shall end with a remove button (`ui-select-field__chip-remove`, a `Button` with the `close` glyph named by the provider string `remove` read with the chip's label); pressing it, or Delete or Backspace on a focused chip, removes that value and commits without opening the list. A read-only or disabled select's chips stay focusable and offer no removal.

Implementation: `src/components/select-field/select-chips.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-chips.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-4.3 - Changes against the committed value

While a multiple select is dirty, the chips of values the edit added shall publish `data-change="added"`, and each committed value the edit removed shall follow the chips as a `FieldPreviousValue` (`ui-select-field__removed`) whose restore button (`Restore <label>`) puts that one value back and commits.

Implementation: `src/components/select-field/select-chips.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-chips.test.tsx`, `src/components/select-field/select-options.test.ts`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-4.4 - Chips inside the frame

`chipPlacement="inside"` shall draw a multiple list select's chips before the select, both in a chip frame (`ui-select-field__chip-frame`), instead of after the select (`below`, the default), and the root publishes `data-chip-placement` (`below` or `inside`) on a multiple select. The chips keep their tag group, keys and removal, and removed values still follow. The reference sheet draws the field's box around the chip frame instead of the trigger: the chips wrap inside it, the trigger shows the placeholder while nothing is chosen and otherwise only its chevron at the end, and its count of the choices stays readable to assistive technology only.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-chips.test.tsx`, `e2e/condition-builder.spec.ts`

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

Every option a search returns shall stay known while the field is mounted, so a chosen searched option keeps its label and icon in the trigger and on its chip after later results no longer include it. The latest version of an option a search returned wins over earlier results and over `options` given as seeds, so its row, the trigger and its chip show the same label, icon, description and disabled state, and choosing a result never changes how it reads.

Implementation: `src/components/select-field/select-search.ts`, `src/components/select-field/select-model.ts`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-search.test.tsx`

### UIC-SELECT-FIELD-5.4 - Paged results

`loadOptions` may return a page, `{ items, cursor }` (the shared `RemotePage`), instead of a list. While the latest results have a `cursor`, the list shall end with React Aria's load-more row (`ui-select-field__load-more`); when it scrolls into view the select calls `loadOptions(query, signal, cursor)` without waiting for `searchDelay`, appends that page's options (remembered as in UIC-SELECT-FIELD-5.3) and, while the page loads, shows the provider string `loading` in the row. A page without a `cursor` ends the list. A first page is asked for with the query and signal alone, and a loader that returns a list has one page. A cursor belongs to the search whose page returned it: it is passed back only with that search's query and to the `loadOptions` that returned it, and only while that search is the latest. Another `loadOptions` function ends the running search and the next page of the results shown, and searches the latest query again from its first page; while no `loadOptions` is given nothing is searched or paged. A loader is told apart by identity, so a caller keeps it stable (for example with `useCallback`) to keep its pages. While a newer search runs, after a search fails and after a next page fails, the select offers no next page; a failed search lists no earlier results, and a page or search that a newer search replaced is dropped whenever it settles, leaving the latest search's pages and pagination as they are.

Implementation: `src/components/select-field/select-search.ts`, `src/components/select-field/select-list.tsx`, `src/components/select-field/select-control.tsx`, `src/utils/use-remote-search.ts`
Verification: `src/components/select-field/select-search.test.tsx`, `src/components/select-field/select-search-pages.test.tsx`, `src/components/select-field/select-search-sources.test.tsx`, `src/utils/use-remote-search.test.ts`, `e2e/select-field.spec.ts`

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

`renderOption(option, state)` shall draw the content of each option row instead of its icon, label and description, receiving the option and the row's state (the shared `SelectableState`: `isSelected`, `isFocused`, `isFocusVisible`, `isHovered`, `isPressed` and `isDisabled`). The row keeps its `option` role, its check slot in a multiple select and its label as the text that type-to-select and the filter match; the trigger and the chips keep drawing the option's icon and label.

Implementation: `src/components/select-field/select-option.tsx`
Verification: `src/components/select-field/select-option.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-7.3 - Virtualized list

With `virtualized`, the list shall render through React Aria's `Virtualizer` with a list layout: only the options in and near view are in the document, placed by the virtualizer's inline offsets, and scrolling or moving focus with the arrow keys, Home and End brings the others in. Every list keeps each option's row while the option and the way rows are drawn stay the same, so typing in the filter of a long list draws no unchanged row again. The reference sheet caps the listbox's height so it scrolls.

Implementation: `src/components/select-field/select-list.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-list.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-8 - Clearing and limits

### UIC-SELECT-FIELD-8.1 - Clear button

With `isClearable`, while the field can be cleared (editable, not required and holding a value, UIC-FIELD-2.5) the frame shall end with a clear button (`ui-select-field__clear`, a `Button` with the `close` glyph named by the provider string `clearValue` from the label, `Clear Fruit`) outside the trigger. Pressing it sets the empty value (`null`, or an empty list for a multiple select) and commits it without opening the list, then moves focus to the trigger.

Implementation: `src/components/select-field/select-trigger.tsx`, `src/components/select-field/select-control.tsx`, `src/core/strings.ts`
Verification: `src/components/select-field/select-trigger.test.tsx`, `e2e/select-field.spec.ts`

### UIC-SELECT-FIELD-8.2 - Maximum values

`maxValues` shall cap a multiple select's value, by the count of its values whatever options are known: no pick or restore makes it hold more, and once it holds that many values, every option it has not chosen is disabled (`aria-disabled`, passed over by the arrow keys and refusing a press) and the restore buttons of removed committed values are disabled, until a value is removed. A single select ignores it.

Implementation: `src/components/select-field/select-model.ts`, `src/components/select-field/select-option.tsx`, `src/components/select-field/select-chips.tsx`
Verification: `src/components/select-field/select-model.test.tsx`, `e2e/select-field.spec.ts`

## UIC-SELECT-FIELD-9 - Trigger and popover

### UIC-SELECT-FIELD-9.1 - Structure

`mode="tree"` accepts hierarchical `items`, `getTextValue`, optional `getChildren`, lazy-child accessors and selection propagation. It renders a `Field` (`ui-select-field`, also `ui-field`) whose control is a frame (`ui-select-field__frame`) holding the trigger button (`ui-select-field__trigger`) and, when shown, the clear button. The trigger shows the value (`ui-select-field__value`), or the `placeholder` (default: the provider's `selectPlaceholder`) with `data-placeholder` while nothing is chosen, and a chevron (`ui-select-field__chevron`); it is named by the field's label and its value. The root publishes `data-selection-mode` (`single`, `multiple`) and `data-value-display` (`label`, `path`).

Implementation: `src/components/select-field/select-tree-field.tsx`, `src/components/select-field/tree-select-trigger.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-9.2 - Popover

Pressing the trigger shall open a popover (`ui-select-field__popover`) below it, publishing the trigger's width as `--ui-trigger-width`, holding a dialog (`ui-select-field__dialog`) named by the field's label, with a [Search Field](SEARCH-FIELD.md) (`ui-select-field__search`) named by the provider's `filterLabel` string with the label, which takes focus, and a `Tree` in its `picker` variant (`ui-select-field__tree`) named by the label, its chosen rows selected. Every opening starts afresh: the search is empty and the tree opens with the ancestors of the chosen nodes expanded. Escape, or a press outside, closes the popover and returns focus to the trigger; Escape in the tree closes it rather than clearing a multiple choice, and Escape in the search field closes it at once, even with text there, rather than clearing that text first; a containing modal stays open. The open state follows `isOpen`, `defaultOpen` and `onOpenChange`.

Indexing the loaded hierarchy shall use an explicit traversal stack. Opening at multiple selected nodes shall collect their distinct ancestors without revisiting shared parent paths.

Implementation: `src/components/select-field/tree-select-control.tsx`, `src/components/select-field/tree-select-popover.tsx`, `src/components/select-field/tree-index.ts`
Verification: `src/components/select-field/tree-index.test.ts`, `src/components/select-field/select-tree-field.test.tsx`, `src/components/select-field/select-dismissal.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-9.3 - Single choice

In a single choice, pressing a leaf row, or Enter or Space on the focused leaf row, shall make its node the value, commit it and close the popover; doing so on the chosen row keeps the value and closes the popover. A branch row opens and closes instead ([UIC-SELECT-FIELD-9.6](#uic-select-field-96---branches-and-leaves)). Pressing the expand button only expands or collapses its row. A node whose id is `''` is a value like any other: chosen, it fills the field and satisfies a required field; only `null` (or an empty list in multiple choice) is no value.

Implementation: `src/components/select-field/select-tree-field.tsx`, `src/components/select-field/tree-select-control.tsx`, `src/components/select-field/tree-select-popover.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-9.4 - Value display

With `valueDisplay` `label` (the default), a chosen node shall read as its text value (`getTextValue`); with `path`, as the text values of its ancestors and itself joined like a [Path](PATH.md) (`Europe/Norway/Oslo`). The trigger and the chips both follow it.

Label display shall read only the selected node’s text; path display reads its ancestors too.

Implementation: `src/components/select-field/tree-select-control.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-9.5 - Unloaded values

A chosen key that matches no loaded node shall read as the key itself, with `data-missing` on the value or its chip, until its node loads.

Implementation: `src/components/select-field/tree-select-control.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`

### UIC-SELECT-FIELD-9.6 - Branches and leaves

A branch is a node with children, or one `hasChildItems` reports as having unloaded children. Pressing a branch row, or Enter (or, in a single choice, Space) on it, shall expand it when it is collapsed and collapse it when it is expanded, choosing nothing and keeping the popover open; the row's checkbox in a multiple choice is not a press on the row. A virtual click on a row, as an assistive technology sends with no pointer or key before it, is such a press too, on loaded and unloaded branches alike, in a single or a multiple choice. By default only leaves are chosen: a branch never becomes the value, and in a multiple choice a branch's checkbox chooses its loaded leaves (with `selectionPropagation`) or nothing (without it). With `selectableBranches`, pressing an expanded branch row, or Enter or Space on it, chooses it instead, a collapsed one still expands first, and a branch's checkbox chooses the branch as in `Tree`.

Implementation: `src/components/select-field/tree-select-popover.tsx`, `src/components/select-field/tree-branch-press.ts`, `src/components/select-field/select-tree-field.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

## UIC-SELECT-FIELD-10 - Search, multiple choice and states

### UIC-SELECT-FIELD-10.1 - Search

Text in the search field shall filter the tree as `Tree`'s `filterText` does: the rows whose text value holds every word show with their ancestors, expanded, and their descendants. Down in the search field moves focus to the tree's first row, except a Down that belongs to an input method composition (`isComposing`, or key code 229), which steps through its candidates; Escape and Enter that a composition owns are left to it too, so they neither close the popover nor choose a row. A tree with no row to show reads the provider's `noResults` string while it filters, else `noItems`.

Implementation: `src/components/select-field/tree-select-popover.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-10.2 - Multiple choice

With `selectionMode` `multiple`, the value shall be the list of chosen keys in reading order, each row draws a checkbox, the popover stays open while the reader chooses, and every change commits at once. With `selectionPropagation` (the default), choosing a node chooses its loaded descendants and a node is chosen exactly when all its loaded children are, as in `Tree`; without it each row is chosen on its own. A chosen branch whose children load or are added later takes them along, reported as a change (`onChange`), not a commit, so a branch is never claimed whole while some of its loaded children are not chosen and the rows, chips and form values agree. Keys of nodes not loaded stay as they are. Without `selectableBranches` the value holds leaves only, and a branch whose loaded children are all chosen still reads as chosen: its row is selected and it shows as one chip. The trigger reads the provider's `selectedCount` string for the chips shown.

Implementation: `src/components/select-field/tree-select-control.tsx`, `src/components/select-field/tree-select-popover.tsx`, `src/components/select-field/tree-index.ts`
Verification: `src/components/select-field/tree-index.test.ts`, `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-10.3 - Chips

A multiple choice shall show its chosen nodes after the frame as a `TagGroup` (`ui-select-field__chips`) named by the provider's `selectedValues` string with the label, one `Tag` (`ui-select-field__chip`) per chosen key, or with `selectionPropagation` per chosen branch (a chosen node whose ancestors are not chosen). While the field is editable each chip can be removed by its button, Delete or Backspace; removing a chip removes its key and, with `selectionPropagation`, its descendants and ancestors, and commits.

Collapsing and removing selected branches shall reuse shared ancestor checks rather than materializing an ancestor array for each selected key.

Implementation: `src/components/select-field/tree-select-control.tsx`, `src/components/select-field/tree-index.ts`
Verification: `src/components/select-field/tree-index.test.ts`, `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-10.4 - Lazy branches

`hasChildItems` and `onLoadChildren` shall pass to the tree, so a branch whose children are not loaded expands to a loading row and loads them ([Tree](TREE.md)); the field indexes the nodes again when the caller's `items` grow.

Implementation: `src/components/select-field/tree-select-popover.tsx`, `src/components/select-field/tree-select-control.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`, `e2e/select-tree.spec.ts`

### UIC-SELECT-FIELD-10.5 - Clear, read-only and disabled

With `isClearable`, while the value can be cleared, a clear `Button` (`ui-select-field__clear`) named by the provider's `clearValue` string with the label shall follow the trigger; pressing it clears and commits the value and focuses the trigger. A read-only field does not open, calls no `onOpenChange` when pressed, and its chips cannot be removed; a disabled field's trigger is disabled.

Implementation: `src/components/select-field/tree-select-control.tsx`, `src/components/select-field/tree-select-trigger.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`

### UIC-SELECT-FIELD-10.6 - Forms

With `name`, the field shall render hidden inputs under that name: one per chosen key for a multiple choice, and one holding the key or an empty entry for a single choice, disabled while the field is. Numeric and text keys with the same spelling remain distinct as inputs are reordered.

Implementation: `src/components/select-field/tree-select-control.tsx`
Verification: `src/components/select-field/select-tree-field.test.tsx`

### UIC-SELECT-FIELD-10.7 - Hooks and caller attributes

`SelectField` shall carry the hooks below and the field base's, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/select-field/select-tree-field.tsx`, `labs/reference/select-field.css`
Verification: `src/components/select-field/select-tree-field.test.tsx`

## UIC-SELECT-FIELD-11 - Icon options

### UIC-SELECT-FIELD-11.1 - Icon options

List options may include an `icon`, an imported icon component or rendered element. The open list draws an icon before the label when present, and a single-selection trigger shows the chosen option's icon. Icon options support the same single and multiple selection modes as text options.

Implementation: `src/components/select-field/select-field.tsx`
Verification: `src/components/select-field/select-icons.test.tsx`, `e2e/select-icons.spec.ts`

### UIC-SELECT-FIELD-11.2 - Filtering

Icon options follow the ordinary list filtering behavior: filtering is automatic for more than ten options or remote search. Explicit `filterable={false}` hides the filter, and `filterable` shows it for a short list.

Implementation: `src/components/select-field/select-field.tsx`
Verification: `src/components/select-field/select-icons.test.tsx`

### UIC-SELECT-FIELD-11.3 - No-icon choice

With `emptyLabel` (for example `No icon`), the list shall start with an option of that label that stands for no value: the trigger shows it while the value is `null`, and picking it commits `null`.

Implementation: `src/components/select-field/select-field.tsx`, `src/components/select-field/select-control.tsx`
Verification: `src/components/select-field/select-icons.test.tsx`, `e2e/select-icons.spec.ts`

### UIC-SELECT-FIELD-11.4 - Hooks and caller attributes

Icon choices use the ordinary `ui-select-field` root and slots, append the caller's className, forward caller data attributes and use the same clear, custom-rendering and virtualization options.

Implementation: `src/components/select-field/select-field.tsx`
Verification: `src/components/select-field/select-icons.test.tsx`

## UIC-SELECT-FIELD-12 - Popup attributes

### UIC-SELECT-FIELD-12.1 - Popup attributes

`popoverProps` shall forward caller attributes and class names to the portalled list or tree popover without moving them onto the field. Library hook classes, layer and mode remain authoritative. A caller popup ID shall remain distinct from the inner tree dialog's accessibility ID; trigger ownership, dismissal and focus restoration remain unchanged.

Implementation: `src/components/select-field/select-list.tsx`, `src/components/select-field/tree-select-popover.tsx`
Verification: `src/components/select-field/select-popup.test.tsx`, `e2e/select-field.spec.ts`

## Hooks

| Hook                                  | Kind      | Values                                     | Description                                                              |
| ------------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `ui-select-field`                     | root      |                                            | The field root (also `ui-field`).                                        |
| `ui-select-field__select`             | slot      |                                            | React Aria's select wrapper; carries the measured label width.           |
| `ui-select-field__frame`              | slot      |                                            | Holds the previous value and the trigger.                                |
| `ui-select-field__chip-frame`         | slot      |                                            | With `chipPlacement="inside"`: holds the chips, then the select.         |
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
| `data-chip-placement`                 | attribute | `below`, `inside`                          | On a multiple select's root: where its chips are drawn.                  |
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
| `data-indeterminate`                  | state     | `true`                                     | On a multiple list option's check slot: mixed membership.                |
| `data-selected`                       | state     | `true`                                     | A chosen option (React Aria).                                            |
| `data-empty`                          | state     | `true`                                     | An empty list or filter (React Aria).                                    |
| `data-allows-removing`                | state     | `true`                                     | A removable chip (React Aria).                                           |
| `data-placement`                      | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the trigger the popover opened on (React Aria).                  |
| `data-trigger`                        | state     | `Select`, `DialogTrigger`                  | What opened the popover (React Aria).                                    |
| `data-entering`                       | state     | `true`                                     | Popover entry animation (React Aria).                                    |
| `data-exiting`                        | state     | `true`                                     | Popover exit animation (React Aria).                                     |
| `data-collection`                     | state     |                                            | React Aria's collection marker.                                          |
| `data-key`                            | state     |                                            | Opaque collection key (React Aria): not the `id`, not for styling.       |
| `data-layout`                         | state     | `stack`                                    | Listbox layout (React Aria).                                             |
| `data-orientation`                    | state     | `vertical`                                 | Listbox orientation (React Aria).                                        |
| `ui-select-field__dialog`             | slot      |                                            | The dialog inside the popover.                                           |
| `ui-select-field__tree`               | slot      |                                            | The tree (also `ui-tree`).                                               |
| `data-value-display`                  | attribute | `label`, `path`                            | On the root: how chosen nodes read.                                      |
| `data-mode`                           | attribute | `list`, `tree`                             | Choice presentation.                                                     |
