# Command Palette

`CommandPalette` lets a reader find and run a command by typing: a modal dialog holding a search field over a menu of commands that narrows as they type. A document-wide chord opens it from anywhere. It is built on React Aria's `ModalOverlay`, `Modal`, `Dialog`, `SearchField` and `Autocomplete`, which provide the focus trap, Escape, outside presses, focus restoration and the virtual focus that keeps typing in the field while the arrow keys move through the commands. The commands are the library [Menu](MENU.md) and its parts, so they keep the menu hooks: sections with headings, items with an icon, a description and a [Shortcut](SHORTCUT.md) hint, separators and disabled items. A palette with several pages of commands is out of scope.

## UIC-COMMAND-PALETTE-1 - Dialog

### UIC-COMMAND-PALETTE-1.1 - Opening and closing

`CommandPalette` shall be open while `isOpen` is true (or, uncontrolled, from `defaultOpen`), report every change through `onOpenChange`, and render nothing while closed. While open it renders, at the end of the document body, the `ui-command-palette` overlay, the `ui-command-palette__panel` box and the `ui-command-palette__dialog` element with `role="dialog"`. A press outside the panel closes it, and so does Escape once the search field is empty ([UIC-COMMAND-PALETTE-2.3](#uic-command-palette-23---keyboard)). A palette whose stylesheet gives it an exit animation stays mounted while it plays (`data-exiting`), but closing hands focus back at once, on the next frame, to the element that held it before the palette opened, unless focus already moved elsewhere; the leaving overlay is `inert`, so it takes no press, key or focus, and reopening it lifts that. The reference sheet fades the overlay out over 250 milliseconds (`--ref-command-palette-exit-duration`, its own, apart from the shared overlay durations) with `pointer-events: none`, and leaves at once under reduced motion.

Implementation: `src/components/command-palette/command-palette.tsx`, `src/components/command-palette/command-palette-focus.ts`, `labs/reference/command-palette.css`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-1.2 - Layering

The overlay shall cover the viewport (fixed position, zero inset) and carry the z-index of the `modal` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)) as a functional inline style, with `data-layer="modal"`. While open, the page beneath is hidden from assistive technology and unreachable by focus.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-1.3 - Document shortcut

While the palette is mounted, its `shortcut` chord (`Ctrl+K` by default, which is Command+K on macOS; written as for [Shortcut](SHORTCUT.md#uic-shortcut-11---canonical-chords)) pressed anywhere in the document shall open it and prevent the browser's own use of the key. The chord matches only with exactly its modifiers held, never on a repeated key or during text composition, and not when something else already handled the key press (its default was prevented). Key presses match as [UIC-SHORTCUT-1.8](SHORTCUT.md#uic-shortcut-18---matching-key-presses) says: a letter or digit in the chord matches the letter or digit the key types or, when the press types another character (`!` for Shift+1, `π` for Option+P on macOS, a letter of a non-Latin layout), the key in that letter's or digit's place on a US layout (its `code`); a non-Latin letter also matches a chord naming it; AltGr typing a character never matches. Pressed inside the open palette, the same chord closes it; pressed while a closed palette is still leaving (its exit animation runs), it opens the palette again. `shortcut={null}` registers no chord; unmounting the palette removes it. One press opens at most one palette: of the palettes mounted in a document whose chord the press matches, the one that registered its chord last (the last mounted, unless another changed its chord since) claims it, and when it unmounts the one before it answers again. A chord pressed from inside another modal overlay (a library overlay on the `modal` layer that is not leaving, or an `aria-modal` dialog) is left to that overlay and opens no palette on top of it.

Implementation: `src/components/command-palette/command-palette.tsx`, `src/components/command-palette/command-palette-shortcut.ts`, `src/components/shortcut/shortcut-match.ts`
Verification: `src/components/command-palette/command-palette.test.tsx`, `src/components/command-palette/command-palette-chord-owner.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-1.4 - Focus

Opening shall move focus to the search field. While open, focus stays inside the dialog. Closing, by a command, Escape, a press outside or the shortcut, shall return focus to the element that was focused when it opened.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-1.5 - Size

`size` (`sm`, `md`, the default, or `lg`) shall be published in `data-size` on the overlay and set the row density of the commands ([UIC-MENU-1.2](MENU.md#uic-menu-12---size)).

Implementation: `src/components/command-palette/command-palette.tsx`, `labs/reference/command-palette.css`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

## UIC-COMMAND-PALETTE-2 - Search and commands

### UIC-COMMAND-PALETTE-2.1 - Commands

The palette shall draw its commands as a `Menu` from `items` (the menu's item, section and separator entries) or from `children` (`MenuItem`, `MenuSection` and `MenuSeparator` elements). Running an enabled command, by Enter or a press, shall call its `onAction` and the palette's `onAction` with its `id`, once, then close the palette, unless `shouldCloseOnSelect={false}` on the item or its section keeps it open. An Enter during a text composition, or the one that confirms an input method candidate (key code 229), belongs to the input method and runs no command.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-2.2 - Filtering

As the reader types, the palette shall keep the commands whose label contains the typed text, ignoring case and accents, and hide the sections and separators left without a command. `filter` replaces the test with a `(textValue, inputValue) => boolean` function; `filter={null}` keeps every command, for results the caller has already filtered.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-2.3 - Keyboard

Focus shall stay in the search field while the first matching command is highlighted as the reader types (the field's `aria-activedescendant`, the command's `data-focused`); Arrow Down and Arrow Up move the highlight, wrapping at the ends; Enter runs the highlighted command. Escape clears the field's text, then, with the field empty, closes the palette.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-2.4 - Highlighted matches

Each command's label shall mark the typed text with [Text Match](TEXT-MATCH.md) ([UIC-MENU-5.4](MENU.md#uic-menu-54---highlighted-matches)); labels of `MenuItem` children drawn through `TextMatch` are marked too.

Implementation: `src/components/command-palette/command-palette.tsx`, `src/components/menu/menu.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-2.5 - Empty state

While no command matches, the menu shall show `ui-command-palette__empty` holding what `renderEmptyState` returns, or the provider's `noResults` string.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-2.6 - Typed text and loading results

`inputValue` with `onInputChange` shall control the field's text and `defaultInputValue` set it uncontrolled; each opening of an uncontrolled palette starts from `defaultInputValue` as it is at that opening, empty by default, including an opening that interrupts the exit animation of the previous one. While `isLoading`, the menu ends with the menu's loading row ([UIC-MENU-5.2](MENU.md#uic-menu-52---loading-more)), which stands alone, without the empty state, while there are no commands, so a caller can fetch results for the typed text and show them as they arrive.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

## UIC-COMMAND-PALETTE-3 - Accessibility and hooks

### UIC-COMMAND-PALETTE-3.1 - Names and roles

The dialog shall be named by `aria-label`, or the provider's `commandPalette` string. The search field is a `role="searchbox"` input named and hinted by `placeholder`, or the provider's `searchCommands` string, that controls the `role="menu"` list of commands; its leading `search` glyph is decorative. Each command is a `menuitem` named by its text ([UIC-MENU-2.1](MENU.md#uic-menu-21---anatomy)).

Implementation: `src/components/command-palette/command-palette.tsx`, `src/core/strings/common.ts`
Verification: `src/components/command-palette/command-palette.test.tsx`, `e2e/command-palette.spec.ts`

### UIC-COMMAND-PALETTE-3.2 - Hooks and caller attributes

`CommandPalette` shall carry the hooks below, append the caller's `className` to the overlay, forward caller `data-*` attributes to the overlay and `id` to the dialog element, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/command-palette/command-palette.tsx`
Verification: `src/components/command-palette/command-palette.test.tsx`

## Hooks

| Hook                               | Kind      | Values           | Description                                                          |
| ---------------------------------- | --------- | ---------------- | -------------------------------------------------------------------- |
| `ui-command-palette`               | root      |                  | The overlay covering the viewport.                                   |
| `ui-command-palette__panel`        | slot      |                  | The box holding the dialog.                                          |
| `ui-command-palette__dialog`       | slot      |                  | The `role="dialog"` element.                                         |
| `ui-command-palette__search`       | slot      |                  | The search field.                                                    |
| `ui-command-palette__search-icon`  | slot      |                  | The decorative `search` glyph before the input (also `ui-glyph`).    |
| `ui-command-palette__search-input` | slot      |                  | The `role="searchbox"` input.                                        |
| `ui-command-palette__empty`        | slot      |                  | The message shown while no command matches.                          |
| `data-layer`                       | attribute | `modal`          | The overlay layer; the z-index is set inline from it.                |
| `data-size`                        | attribute | `sm`, `md`, `lg` | Row density of the commands.                                         |
| `data-entering`                    | state     | `true`           | On the overlay and panel while an entry animation runs (React Aria). |
| `data-exiting`                     | state     | `true`           | On the overlay and panel while an exit animation runs (React Aria).  |
| `data-empty`                       | state     | `true`           | On the search field while it holds no text (React Aria).             |
| `data-focused`                     | state     | `true`           | On the input while focused (React Aria).                             |
| `data-focus-visible`               | state     | `true`           | On the input while keyboard focused (React Aria).                    |
| `data-hovered`                     | state     | `true`           | On the input while the pointer is over it (React Aria).              |
