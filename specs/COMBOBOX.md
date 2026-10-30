# Combobox

`Combobox` is a text input with a list of suggestions, built on React Aria's `ComboBox`, `Label`, `Group`, `Input`, `Button`, `Popover` and `ListBox`. The reader types freely (with `allowsCustomValue`) or completes the text from the list, and may pick several options, shown as chips in a [Tag Group](TAG-GROUP.md). The combobox filters its own suggestions (`defaultItems`), the caller filters them, synchronously or asynchronously, from `onInputChange` (`items`), or the combobox searches them through the caller's loader as the reader types (`loadItems`). Long lists render virtualized and load more as they scroll ([COLLECTIONS.md](COLLECTIONS.md)); typed text can add a new option, highlight its matches, complete itself inline, and keep the first match highlighted. React Aria provides the roles, the virtual focus in the list and the keyboard behaviour; the combobox declares its own props and hands them to it.

## UIC-COMBOBOX-1 - Field

### UIC-COMBOBOX-1.1 - Structure

`Combobox` shall render, inside its `ui-combobox` root: the `label` (`ui-combobox__label`), which names the input; a field group (`ui-combobox__field`) holding, for the `search` variant, a decorative search glyph (`ui-combobox__search-icon`), the text input with `role="combobox"` (`ui-combobox__input`), the busy indicator and the clear button when they apply, and the React Aria button that opens the list (`ui-combobox__button`); then the `description` (`ui-combobox__description`) and the `errorMessage` while invalid (`ui-combobox__error`). Without `label`, `aria-label` names the input.

Implementation: `src/components/combobox/combobox.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.2 - Variants and sizes

`variant` (`default` or `search`) and `size` (`xs`, `sm`, `md` by default, `lg`) shall be published in `data-variant` and `data-size`. The popover shall publish the same `data-size`, so its options, loading, creation and empty rows follow the field's size. The reference sheet draws fields and single-line popup rows at 20, 24, 28 and 32 pixels, with matching type sizes. An `xs` multiple combobox uses the smallest (`sm`) tag-group chips.

Implementation: `src/components/combobox/combobox.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.3 - States

`isDisabled`, `isReadOnly`, `isInvalid` and `isRequired` shall pass to React Aria, which publishes `data-disabled`, `data-readonly`, `data-invalid` and `data-required` on the root and keeps a disabled or read-only list closed even when an open state was explicitly requested; the root also publishes `data-focused` and `data-open`. `isPending` marks the caller still fetching suggestions: it publishes `data-pending`, sets `aria-busy="true"` on the input and draws a decorative busy indicator (`ui-combobox__spinner`) in the field.

Implementation: `src/components/combobox/combobox.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.4 - Clear button

While the input holds text and the combobox is neither disabled nor read-only, the field shall draw a bare small `Button` (`close` glyph, named by the provider string `clear`, also `ui-combobox__clear`) that empties the input and, for a single combobox, the selection, and returns focus to the input; a pointer press keeps focus in the input throughout, so pressing it while the list is open works too. A multiple combobox keeps its chips, which have their own remove buttons, and reports no change.

Implementation: `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-field.tsx`
Verification: `src/components/combobox/combobox.test.tsx`, `src/components/combobox/combobox-chips.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-1.5 - Narrow rows

The reference stylesheet shall keep the field inside the width a flex or grid row gives the combobox, however narrow, empty or with a chosen value and its clear button: the root may shrink below its usual width, its single grid track never grows to the input's intrinsic width, and the input shrinks while the toggle and clear buttons keep their size, in both themes. The field's look at ordinary widths, its popover and its keyboard behaviour are unchanged.

Implementation: `labs/reference/combobox.css`
Verification: `e2e/combobox.spec.ts`

## UIC-COMBOBOX-2 - Suggestions

### UIC-COMBOBOX-2.1 - Options and sections

Suggestions shall be options (`id`, `label`, optional `description`, `icon` as a built-in icon component or element, and `isDisabled`) or sections (`id`, `title`, `options`). An option draws its icon (`ui-combobox__option-icon`), label (`ui-combobox__option-label`) and description (`ui-combobox__option-description`) in a `role="option"` row (`ui-combobox__option`), named by its label and description text; a section draws a group (`ui-combobox__section`) headed by its title (`ui-combobox__section-header`).

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.2 - Filtering

With `defaultItems`, the combobox shall show the options whose label contains the typed text, ignoring case, and drop sections left empty. With `items`, it shows exactly the given suggestions, so the caller filters them, for example after fetching them from `onInputChange` while `isPending`. The typed text is held by `inputValue` (controlled) or `defaultInputValue`, and every change of it calls `onInputChange` with the text.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.3 - Opening

The list shall open in the `dropdown` layer as the reader types (`menuTrigger="input"`, the default), on focus (`focus`) or only on Arrow Down, Arrow Up or the button (`manual`); Arrow Down and Arrow Up open it from the input and the button toggles it. Opening waits for focus-driven scrolling, so tabbing to a field below the viewport keeps its list usable. It closes when the input loses focus or a scroll container of the field scrolls after opening.

Implementation: `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-suggestions.tsx`, `src/utils/use-frame-flag.ts`
Verification: `src/components/combobox/combobox.test.tsx`, `src/components/combobox/combobox-opening.test.tsx`, `src/utils/use-frame-flag.test.ts`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.4 - Keyboard and picking

While the list is open, focus shall stay in the input: Arrow Down and Arrow Up move the highlighted option (the input's `aria-activedescendant`, `data-focused` on the option) and pass over disabled options; Enter or a press picks the option, writes its label to the input, calls `onChange` with its `id` (the value, with `defaultValue` and the controlled `value`, is the picked `id` or `null`) and closes the list; Escape closes the list. A disabled option cannot be picked. Numeric and text ids with the same spelling remain distinct in suggestions and chips, and callbacks retain each id's original type.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.5 - Custom values

With `allowsCustomValue`, the typed text shall stay when the input loses focus or Escape closes the list, and no option is selected. Custom text is controlled by `inputValue` and `onInputChange`, or starts from `defaultInputValue`; `value` and `defaultValue` remain option ids, so an unknown id does not become custom text. Custom text and form submission retain their original characters without collection-key encoding. Without it, the input returns to the selected option's label (or empties) when the reader leaves it.

Implementation: `src/components/combobox/combobox.tsx`
Verification: `src/components/combobox/combobox.test.tsx`

### UIC-COMBOBOX-2.6 - Empty list

When no suggestion matches, the list shall still open (`allowsEmptyCollection`, true by default) and show the provider string `noResults` in `ui-combobox__empty`.

Implementation: `src/components/combobox/combobox-suggestions.tsx`, `src/core/strings.ts`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.7 - Popover

The list's popover (`ui-combobox__popover`) shall sit on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')` ([PORTAL.md](PORTAL.md)), 4 pixels below the field and at least as wide as the field, which it publishes as `--ui-trigger-width`, with the listbox (`ui-combobox__listbox`) inside.

Implementation: `src/components/combobox/combobox-suggestions.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-2.8 - Hooks and caller attributes

`Combobox` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to React Aria's `ComboBox`. With `name`, hidden inputs submit the original chosen ids (one per chosen value); with `allowsCustomValue`, the input submits its text. A disabled control submits nothing.

Implementation: `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox.test.tsx`, `src/components/combobox/combobox-suggestions.test.tsx`

## UIC-COMBOBOX-3 - Picking and entering

### UIC-COMBOBOX-3.1 - Multiple selection with chips

`selectionMode="multiple"` shall let the reader pick several options, with `value`, `defaultValue` and `onChange` holding the list of ids: picking an option toggles it, keeps the list open (`aria-multiselectable` on the listbox) and clears the typed text. An unchanged controlled selection shall not clear typed search text as input or loading state rerenders. The chosen options shall show, in value order, as chips in the library's `TagGroup` (`ui-combobox__chips`, also `ui-tag-group`, sized like the field) at the start of the field group, named by the provider's `selectedValues` string from the label text (or `aria-label`); a label drawn as markup, or the elements `aria-labelledby` names, give their text once rendered. A chip shows its option's label, or the label it had when last listed if the suggestions no longer list it, or its id. A chip also retains its most recently listed icon when suggestions change. Only current selections are remembered; removing a selection releases its cached option. On an editable combobox each chip offers the tag group's remove button, and Delete or Backspace on a focused chip removes it; a disabled or read-only one offers no removal. React Aria hides everything but the input and the list from assistive technology while the list is open.

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

### UIC-COMBOBOX-3.5 - Chip icons

A chip of a multiple combobox shall draw its option's `icon` (a built-in icon component or an element, such as an avatar) before its label, in an `Icon` that also carries `ui-combobox__chip-icon` and is hidden from assistive technology, so the chip is named by its label alone. A chip whose option has no icon draws none.

Implementation: `src/components/combobox/combobox-chips.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox-chips.test.tsx`, `e2e/combobox.spec.ts`

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

`renderOption(option, state)` shall draw the content of each option row instead of its icon, label and description, receiving the option and the row's state (the shared `SelectableState`: `isFocused`, `isFocusVisible`, `isSelected`, `isHovered`, `isPressed` and `isDisabled`). The row keeps its `option` role, its hook and its label as the text that the filter matches and the input shows once picked.

Implementation: `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-suggestions.test.tsx`, `e2e/combobox.spec.ts`

## UIC-COMBOBOX-5 - Remote search and open state

### UIC-COMBOBOX-5.1 - Searching suggestions

With `loadItems(query, signal)`, the combobox shall list the suggestions the loader returns for the trimmed input text instead of `items` and `defaultItems`, unfiltered, in the order returned; they may be options or sections. Only an open list searches: opening the list, or a new `loadItems` while it is open, searches the current text at once, and a change of the text searches it once `searchDelay` milliseconds (240 by default) have passed since the last keystroke. Text shorter than `minSearchLength` (1 by default; 0 also searches the empty text) runs no search; the list then shows `items` or `defaultItems` as given, unfiltered (for example recently used options), or nothing. A newer search aborts the signal of the one it replaces, whose results never show. A closed list keeps the latest results, so a picked option keeps the label the input and its chip show.

Implementation: `src/components/combobox/combobox-search.ts`, `src/components/combobox/combobox-state.ts`, `src/utils/use-remote-search.ts`
Verification: `src/components/combobox/combobox-search.test.tsx`, `src/utils/use-remote-search.test.ts`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-5.2 - Search status

While a search runs, the combobox shall be pending as with `isPending` (UIC-COMBOBOX-1.3): `data-pending`, `aria-busy="true"` on the input and the busy indicator, keeping the previous results listed. A list with no option says, in `ui-combobox__empty` and in order of precedence, the provider string `loading` while a search runs, `searchFailed` after the latest search rejected, `typeToSearch` while the text is shorter than `minSearchLength`, and otherwise the empty state (UIC-COMBOBOX-5.4).

Implementation: `src/components/combobox/combobox-search.ts`, `src/components/combobox/combobox-state.ts`, `src/components/combobox/combobox-suggestions.tsx`, `src/core/field-strings.ts`
Verification: `src/components/combobox/combobox-search.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-5.3 - Paged results

`loadItems` may return a page, `{ items, cursor }`, instead of a list. While the latest results have a `cursor`, the list shall end with the loading row of UIC-COMBOBOX-4.2; when it scrolls into view the combobox calls `loadItems(query, signal, cursor)` without waiting for `searchDelay` and appends that page, showing the provider string `loading` in the row while it loads. A page without a `cursor` ends the list; a first page is asked for with the query and signal alone. With `loadItems`, `onLoadMore` and `isLoading` are not used. A cursor belongs to the search whose page returned it: it is passed back only with that search's query, and only while that search is the latest. While a newer search runs, after a search fails and after a next page fails, the list offers no next page; a failed search lists no earlier results, and a page or search that a newer search replaced is dropped whenever it settles, leaving the latest search's pages and pagination as they are.

Implementation: `src/components/combobox/combobox-search.ts`, `src/components/combobox/combobox-state.ts`, `src/utils/use-remote-search.ts`
Verification: `src/components/combobox/combobox-search.test.tsx`, `src/components/combobox/combobox-search-pages.test.tsx`, `src/utils/use-remote-search.test.ts`

### UIC-COMBOBOX-5.4 - Empty state

`renderEmptyState()` shall draw the content of an empty list (`ui-combobox__empty`) in place of the provider string `noResults`, for any source of suggestions, while no search status applies (UIC-COMBOBOX-5.2) and no loading row stands in for it.

Implementation: `src/components/combobox/combobox-search.ts`, `src/components/combobox/combobox-suggestions.tsx`
Verification: `src/components/combobox/combobox-search.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-5.5 - List header

`listHeader` shall draw its content at the top of the popover, above the listbox, in `ui-combobox__list-header`, for controls such as filters that change `loadItems` or `items`. Focus moving into the header keeps the list open, and after a press in the header focus returns to the input, so the reader keeps typing and moving through the options.

Implementation: `src/components/combobox/combobox-suggestions.tsx`, `labs/reference/combobox.css`
Verification: `src/components/combobox/combobox.test.tsx`, `e2e/combobox.spec.ts`

### UIC-COMBOBOX-5.6 - Open state

The list's open state shall be controllable: `isOpen` (controlled) or `defaultOpen` sets it, and `onOpenChange` reports each change the reader asks for (typing, the button, the arrow keys, Escape, a pick, leaving the input). A controlled list the caller does not change stays as `isOpen` says; closing it commits the text as Escape does.

Implementation: `src/components/combobox/combobox-state.ts`, `src/components/combobox/combobox-effects.ts`
Verification: `src/components/combobox/combobox.test.tsx`

### UIC-COMBOBOX-5.7 - Input reference and focus on mount

`inputRef` shall receive the text input element, and `autoFocus` shall focus the input when the combobox mounts.

Implementation: `src/components/combobox/combobox.tsx`, `src/components/combobox/combobox-field.tsx`
Verification: `src/components/combobox/combobox.test.tsx`

## Hooks

| Hook                              | Kind      | Values                                     | Description                                                         |
| --------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `ui-combobox`                     | root      |                                            | The combobox wrapper.                                               |
| `ui-combobox__label`              | slot      |                                            | The visible label.                                                  |
| `ui-combobox__field`              | slot      |                                            | The group framing the input and its buttons.                        |
| `ui-combobox__search-icon`        | slot      |                                            | Leading search glyph of the `search` variant.                       |
| `ui-combobox__input`              | slot      |                                            | The text input (`role="combobox"`).                                 |
| `ui-combobox__spinner`            | slot      |                                            | Busy indicator while pending.                                       |
| `ui-combobox__clear`              | slot      |                                            | The clear button (also `ui-button`).                                |
| `ui-combobox__button`             | slot      |                                            | The button that opens the list.                                     |
| `ui-combobox__description`        | slot      |                                            | Help text.                                                          |
| `ui-combobox__error`              | slot      |                                            | Error message while invalid.                                        |
| `ui-combobox__popover`            | slot      |                                            | The list's floating surface.                                        |
| `--ui-trigger-width`              | property  |                                            | Width of the element the popover opens from, in pixels.             |
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
| `ui-combobox__chip-icon`          | slot      |                                            | A chip's icon (also `ui-icon`).                                     |
| `ui-combobox__list-header`        | slot      |                                            | The controls above the listbox.                                     |
| `data-variant`                    | attribute | `default`, `search`                        | Variant.                                                            |
| `data-size`                       | attribute | `xs`, `sm`, `md`, `lg`                     | Field and popover size.                                             |
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
| `data-key`                        | state     |                                            | Opaque collection key (React Aria): not the `id`, not for styling.  |
| `data-layout`                     | state     | `stack`                                    | Listbox layout (React Aria).                                        |
| `data-orientation`                | state     | `vertical`                                 | Listbox orientation (React Aria).                                   |
