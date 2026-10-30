# Character Grid

`CharacterGrid` chooses a character, such as a symbol to insert into text, from sets the caller supplies: a search field, then one two-dimensional grid whose sections are the caller's categories, with the recently chosen characters first, and a preview naming the character under the pointer or focus. It is meant to sit in a [Popover](POPOVER.md) or a menu panel. Emoji, with their own data, skin tones and custom images, belong in the [Emoji Picker](EMOJI-PICKER.md).

## UIC-CHARACTER-GRID-1 - Grid and choice

### UIC-CHARACTER-GRID-1.1 - Structure

`CharacterGrid` shall render a root `<div role="group">` (`ui-character-grid`) named by `aria-label`, `aria-labelledby` or, without either, the provider's `characterGrid` string, holding a [Search Field](SEARCH-FIELD.md) (`ui-character-grid__search`) named by the `searchCharacters` string, then a React Aria grid list with a grid layout (`ui-character-grid__grid`) named like the root, then the preview. Each of `categories` is a section of the grid (`ui-character-grid__section`, `role="rowgroup"`) headed by its `label` (`ui-character-grid__heading`), holding one cell per character (`ui-character-grid__cell`) that shows `char` and is named by `name`.

Category and cell identities shall remain distinct when category IDs contain whitespace or separator characters. Choosing a cell always reports its original character entry.

Implementation: `src/components/character-grid/character-grid.tsx`, `src/core/picker-strings.ts`
Verification: `src/components/character-grid/character-grid.test.tsx`, `e2e/character-grid.spec.ts`

### UIC-CHARACTER-GRID-1.2 - Choosing

A click on a cell, or Enter on the focused cell, shall call `onSelect` once with that character's entry (`{ char, name }`) and record it as recently chosen ([UIC-CHARACTER-GRID-2.2](#uic-character-grid-22---recently-chosen)).

Implementation: `src/components/character-grid/character-grid.tsx`
Verification: `src/components/character-grid/character-grid.test.tsx`, `e2e/character-grid.spec.ts`

### UIC-CHARACTER-GRID-1.3 - Keyboard

The grid shall be one tab stop. The arrow keys move between cells in two dimensions by their positions, across sections; Home and End move to the first and last cell; typing a name's first letters moves to it. The arrow keys, Home and End never reach the surface that holds the grid, even at its edges.

Implementation: `src/components/character-grid/character-grid.tsx`
Verification: `src/components/character-grid/character-grid.test.tsx`, `e2e/character-grid.spec.ts`

### UIC-CHARACTER-GRID-1.4 - Preview

The `ui-character-grid__preview` shall show the character last hovered or focused: the character in `ui-character-grid__preview-char`, its name in `ui-character-grid__preview-name` and its code points in Unicode notation (`U+00A9`, separated by spaces for a sequence) in `ui-character-grid__preview-code`. It is empty before any, and hidden from assistive technology, since the focused cell already announces its name. Hovering or focusing a cell shall redraw the preview, not the cells.

Implementation: `src/components/character-grid/character-grid.tsx`, `src/components/character-grid/character-filter.ts`
Verification: `src/components/character-grid/character-filter.test.ts`, `src/components/character-grid/character-grid.test.tsx`

## UIC-CHARACTER-GRID-2 - Search, recent characters and hooks

### UIC-CHARACTER-GRID-2.1 - Search

Text in the search field shall narrow every section to the characters that match, and leave out sections without a match, while the root publishes `data-searching`. A character matches when its name holds every word of the text, ignoring case and accents, when the text is the character itself, or when the text is its code point (`U+00B0`, `u+b0`). With no match the grid gives way to a `role="status"` message (`ui-character-grid__message`) reading the provider's `noResults` string. Enter in the search field chooses the first character shown, Down moves focus to it, and Escape in the empty field reaches the surface around the grid, so a popover holding it closes.

Implementation: `src/components/character-grid/character-grid.tsx`, `src/components/character-grid/character-filter.ts`
Verification: `src/components/character-grid/character-filter.test.ts`, `src/components/character-grid/character-grid.test.tsx`, `e2e/character-grid.spec.ts`

### UIC-CHARACTER-GRID-2.2 - Recently chosen

While nothing is searched, the characters chosen last shall lead the grid in a section headed by the provider's `recentCharacters` string: most recent first, without duplicates, at most 16. With `persistKey` the list is kept through the provider's storage adapter under that key, as a JSON array of characters, so it survives remounts; without it, it lasts as long as the grid. A stored character that no category offers any longer is left out, and an unreadable stored value, or one that is not a list of characters, counts as none.

Implementation: `src/components/character-grid/use-recent-characters.ts`, `src/components/character-grid/character-grid.tsx`
Verification: `src/components/character-grid/character-grid.test.tsx`, `e2e/character-grid.spec.ts`

### UIC-CHARACTER-GRID-2.3 - Auto focus

With `autoFocus`, the grid shall focus its search field when it mounts.

Implementation: `src/components/character-grid/character-grid.tsx`
Verification: `src/components/character-grid/character-grid.test.tsx`, `e2e/character-grid.spec.ts`

### UIC-CHARACTER-GRID-2.4 - Hooks and caller attributes

`CharacterGrid` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/character-grid/character-grid.tsx`, `labs/reference/character-grid.css`
Verification: `src/components/character-grid/character-grid.test.tsx`

## Hooks

| Hook                              | Kind      | Values     | Description                                                                |
| --------------------------------- | --------- | ---------- | -------------------------------------------------------------------------- |
| `ui-character-grid`               | root      |            | The grid's `<div role="group">`.                                           |
| `ui-character-grid__search`       | slot      |            | The search field (also `ui-search-field`).                                 |
| `ui-character-grid__grid`         | slot      |            | The grid list.                                                             |
| `ui-character-grid__section`      | slot      |            | One category's section (`role="rowgroup"`).                                |
| `ui-character-grid__heading`      | slot      |            | A section's heading row.                                                   |
| `ui-character-grid__cell`         | slot      |            | One character's cell (`role="row"`).                                       |
| `ui-character-grid__message`      | slot      |            | The message shown when a search matches nothing.                           |
| `ui-character-grid__preview`      | slot      |            | The preview of the hovered or focused character.                           |
| `ui-character-grid__preview-char` | slot      |            | The previewed character.                                                   |
| `ui-character-grid__preview-name` | slot      |            | The previewed character's name.                                            |
| `ui-character-grid__preview-code` | slot      |            | The previewed character's code points.                                     |
| `data-searching`                  | state     | `true`     | On the root: the search field holds text.                                  |
| `data-key`                        | attribute |            | Opaque collection key (React Aria): not the character, not for styling.    |
| `data-collection`                 | attribute |            | React Aria's collection identifier on the grid and cells; not for styling. |
| `data-orientation`                | attribute | `vertical` | On the grid: its axis (React Aria).                                        |
| `data-layout`                     | attribute | `grid`     | On the grid: its layout (React Aria).                                      |
| `data-empty`                      | state     | `true`     | On the grid: it holds no cell (React Aria).                                |
| `data-hovered`                    | state     | `true`     | On a cell: under the pointer (React Aria).                                 |
| `data-pressed`                    | state     | `true`     | On a cell: being pressed (React Aria).                                     |
| `data-focused`                    | state     | `true`     | On the grid or a cell: focused (React Aria).                               |
| `data-focus-visible`              | state     | `true`     | On the grid or a cell: focused from the keyboard (React Aria).             |
| `data-focus-visible-within`       | state     | `true`     | On a cell: keyboard focus within it (React Aria).                          |
| `data-focus-within`               | state     | `true`     | On the grid: focus is inside it (React Aria).                              |
