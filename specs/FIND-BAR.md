# Find Bar

`FindBar` is a find row for a surface that searches its own content: a find box with the match count ("3 of 12"), previous and next match, an optional menu of matching options (match case, whole words, …), an optional replacement with Replace and Replace all, and an optional Close button. The caller owns the matching: it reads the query and the options, finds the matches, and reports how many there are and which one is current. [Code Editor](CODE-EDITOR.md) and [PDF Viewer](PDF-VIEWER.md) draw their find rows with it. Opening the bar with a shortcut (Ctrl+F or Cmd+F, Ctrl+G or Cmd+G) belongs to the caller, which can move focus to the find box through `inputRef`.

## UIC-FIND-BAR-1 - Finding

### UIC-FIND-BAR-1.1 - Find box

`FindBar` shall render a `ui-find-bar` element holding a small [Search Field](SEARCH-FIELD.md) (`ui-find-bar__query`) named by `label`, or the provider's `find` string, with the caller's `placeholder`. The query is `query` (controlled) or `defaultQuery` (uncontrolled), reported through `onQueryChange`; the search field's clear button and Escape empty it (unless the bar closes, UIC-FIND-BAR-1.6). `inputRef` receives the box's input, so a caller can move focus to it.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

### UIC-FIND-BAR-1.2 - Match count

After the find box, a polite status (`ui-find-bar__status`, `role="status"`) shall read the provider's `searching` string while `isPending`; otherwise nothing while `matchCount` is `undefined` (nothing is searched), its `noResults` string for no match, its `stepOfTotal` string for the current match of the total (`currentIndex`, zero-based) and its `matchTotal` string when no match is current. While `isPending` the root publishes `data-pending` and the find box shows its spinner.

Implementation: `src/components/find-bar/find-bar.tsx`, `src/core/content-strings.ts`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

### UIC-FIND-BAR-1.3 - Stepping through matches

Previous match and Next match icon buttons (`ui-find-bar__previous` and `ui-find-bar__next`, the `arrow-up` and `arrow-down` glyphs, the provider's `previousMatch` and `nextMatch` strings) shall call `onPrevious` and `onNext`, as Shift+Enter and Enter in the find box do; the buttons are disabled and the keys do nothing while there is no match, or when the Enter confirms a text composition. Enter never submits an enclosing form.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

### UIC-FIND-BAR-1.4 - Matching options

With `options` (each an `id` and a `label`), an icon-only [Dropdown Menu](DROPDOWN-MENU.md) (`ui-find-bar__options`, the `chevron-down` glyph, the provider's `findOptions` string) shall follow the match buttons and check the options that are on; choosing one turns it on or off and keeps the menu open. The options turned on are `selectedOptions` (controlled) or `defaultSelectedOptions` (uncontrolled), reported as a set of ids through `onSelectedOptionsChange`. Without options there is no menu.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

### UIC-FIND-BAR-1.5 - Replacing

With `onReplace` or `onReplaceAll`, the bar shall add a replacement box (`ui-find-bar__replacement`, named by the provider's `replaceWith` string) and, for each handler given, a Replace (`ui-find-bar__replace`, the `replace` string) or Replace all (`ui-find-bar__replace-all`, the `replaceAll` string) button that calls it with the replacement text; Enter in the replacement box replaces, except the Enter that confirms a text composition. The buttons are disabled and Enter does nothing while there is no match. The replacement is `replacement` (controlled) or `defaultReplacement` (uncontrolled), reported through `onReplacementChange`.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

### UIC-FIND-BAR-1.6 - Closing

With `onClose`, the bar shall end with a Close icon button (`ui-find-bar__close`, the `close` glyph and string) that calls it, and Escape anywhere in the bar calls it too, before the find box would empty itself; Escape inside the options menu only closes the menu. Returning focus is the caller's.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

## UIC-FIND-BAR-2 - Accessibility and hooks

### UIC-FIND-BAR-2.1 - Names, order and announcements

Every control shall be named: the find box by its label, the replacement box and each button by a provider string, the options menu by `findOptions`. The parts follow in this order in the document, which is the tab order: the find box, its clear button while it holds text, the status, Previous match, Next match, the options, the replacement box, Replace, Replace all, Close. The status is a polite live region, so each new count is read out without moving focus.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`, `e2e/find-bar.spec.ts`

### UIC-FIND-BAR-2.2 - Hooks and caller attributes

`FindBar` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes and `id` to it. Its parts keep their own components' hooks (`ui-search-field`, `ui-icon-button`, `ui-button`, `ui-dropdown-menu`) beside the slot classes.

Implementation: `src/components/find-bar/find-bar.tsx`
Verification: `src/components/find-bar/find-bar.test.tsx`

## Hooks

| Hook                       | Kind  | Values | Description                                                       |
| -------------------------- | ----- | ------ | ----------------------------------------------------------------- |
| `ui-find-bar`              | root  |        | The find row.                                                     |
| `ui-find-bar__query`       | slot  |        | The find box, a Search Field.                                     |
| `ui-find-bar__status`      | slot  |        | The `role="status"` match count.                                  |
| `ui-find-bar__previous`    | slot  |        | The Previous match button.                                        |
| `ui-find-bar__next`        | slot  |        | The Next match button.                                            |
| `ui-find-bar__options`     | slot  |        | The matching options menu's trigger.                              |
| `ui-find-bar__replacement` | slot  |        | The replacement `<input>`.                                        |
| `ui-find-bar__replace`     | slot  |        | The Replace button.                                               |
| `ui-find-bar__replace-all` | slot  |        | The Replace all button.                                           |
| `ui-find-bar__close`       | slot  |        | The Close button.                                                 |
| `data-pending`             | state | `true` | On the root while the matches are being looked for.               |
| `data-focused`             | state | `true` | On the replacement box while it has focus (React Aria).           |
| `data-focus-visible`       | state | `true` | On the replacement box while it has keyboard focus (React Aria).  |
| `data-hovered`             | state | `true` | On the replacement box while the pointer is over it (React Aria). |
