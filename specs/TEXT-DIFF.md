# Text Diff

`TextDiff` shows the difference between two texts line by line: unified in one column, or split with the old text beside the new one. Changed lines carry their word changes, both sides carry line numbers, long unchanged runs fold behind buttons that show them, and the caller can draw widgets (comments, notes) under any line. A header counts the lines added and removed and moves between changes. It builds on the line and word diffs of [Diff](DIFF.md), on [Scroll Region](SCROLL-REGION.md) panes and, in the split layout, on [Synced Scroll](SYNCED-SCROLL.md). [Inline Text Diff](INLINE-TEXT-DIFF.md) is the inline counterpart for one value.

## UIC-TEXT-DIFF-1 - Lines

### UIC-TEXT-DIFF-1.1 - Lines and changes

`TextDiff` shall compare `oldText` and `newText` with `diffLines` ([UIC-DIFF-1](DIFF.md#uic-diff-1---line-diff)) and draw each line as a row (`ui-text-diff__line`) publishing `data-change`: `unchanged` for a line both texts share, `removed` for a line only the old text has and `added` for a line only the new one has. A change is a run of removed lines followed by a run of added lines between unchanged runs. Each line knows its 1-based number in the old text and in the new text, a removed line having no new number and an added line no old number.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/components/text-diff/diff-rows.ts`, `src/components/text-diff/text-diff-table.tsx`
Verification: `src/components/text-diff/diff-rows.test.ts`, `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-1.2 - Word changes

Within a change, the first removed line shall pair with the first added line, the second with the second, and so on. A paired line whose word diff (`diffWords`, [UIC-DIFF-2](DIFF.md#uic-diff-2---word-diff)) shares at least one word with its partner wraps each changed run in a `ui-text-diff__word` element; a line without a partner, or one that shares no word with it, has no word marks.

Implementation: `src/components/text-diff/diff-rows.ts`, `src/components/text-diff/text-diff-table.tsx`
Verification: `src/components/text-diff/diff-rows.test.ts`, `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-1.3 - Unified layout

With `layout="unified"` (the default, published as `data-layout`), the lines shall form one table (`ui-text-diff__table`) inside one `ui-text-diff__pane` (`data-side="both"`), each change listing its removed lines before its added lines. A row holds two `ui-text-diff__number` cells (`data-side="old"`, then `data-side="new"`), a `ui-text-diff__marker` cell and a `ui-text-diff__content` cell whose `ui-text-diff__text` element is an `<ins>` for an added line, a `<del>` for a removed line and a `<span>` otherwise.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/components/text-diff/text-diff-table.tsx`
Verification: `src/components/text-diff/diff-rows.test.ts`, `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-1.4 - Split layout

With `layout="split"`, a `ui-text-diff__panes` element shall hold two panes, `data-side="old"` then `data-side="new"`, each a table of its side's rows: a row holds one number cell, the marker cell and the content cell. Both tables list the same rows in the same order: an unchanged line on both sides, and the lines of a change side by side, where the side with fewer lines fills the rest with empty `ui-text-diff__filler` rows.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/components/text-diff/diff-rows.ts`, `src/components/text-diff/text-diff-table.tsx`
Verification: `src/components/text-diff/diff-rows.test.ts`, `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-1.5 - Panes scroll together

The split panes shall scroll vertically together through `useSyncedScroll` with matched anchors ([UIC-SYNCED-SCROLL-1.2](SYNCED-SCROLL.md#uic-synced-scroll-12---matched-anchors)): the line, filler and fold rows of both panes, matched by their order, so a widget drawn on one side only shifts the panes by its height and they meet again at the next shared row. Each pane scrolls horizontally on its own.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/utils/use-synced-scroll.ts`
Verification: `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-1.6 - Folded unchanged lines

An unchanged run shall keep `context` lines (3 by default) next to each change it touches and fold the rest into one `ui-text-diff__fold` row; the start and the end of the text keep no context, so a run before the first change keeps only its last lines. A run no longer than its context, and every line of two texts without a change, stay whole. The fold row holds a `ui-text-diff__expand` [Button](BUTTON.md) reading the provider's `textDiffShowLines` string with the hidden count; pressing it shows the whole run and moves focus to the first line it showed. In the split layout the old pane's fold row repeats the text, hidden from assistive technology, and the new pane's holds the button. Opened folds close again when either text changes.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/components/text-diff/diff-rows.ts`, `src/components/text-diff/text-diff-table.tsx`, `src/core/strings/diff.ts`
Verification: `src/components/text-diff/diff-rows.test.ts`, `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-1.7 - Line widgets

`renderLineWidget(line)` shall be called with each drawn line (`change`, `oldNumber`, `newNumber`, `text`), and what it returns, unless nothing (`null`, `undefined`, a boolean or an empty string), draws in a `ui-text-diff__widget` row right under the line, its one cell spanning the table. In the split layout a line's widget draws once: in the new pane when the line has a new number, else in the old pane.

Implementation: `src/components/text-diff/text-diff-table.tsx`
Verification: `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

## UIC-TEXT-DIFF-2 - Summary and navigation

### UIC-TEXT-DIFF-2.1 - Summary

A `ui-text-diff__header` shall lead the diff with a `ui-text-diff__summary` holding two `ui-text-diff__count` elements, `+n` added lines (`data-change="added"`) and `−n` removed lines (`data-change="removed"`), hidden from assistive technology, followed by the provider's `textDiffSummary` string, visually hidden.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/core/strings/diff.ts`
Verification: `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-2.2 - Moving between changes

A `ui-text-diff__navigation` element in the header shall hold `ui-text-diff__previous` and `ui-text-diff__next` [Icon Buttons](BUTTON.md), named by the provider's `textDiffPreviousChange` and `textDiffNextChange` strings. Before any move, Next goes to the first change and Previous is disabled; Previous is disabled at the first change and Next at the last, and both with no change. Moving to a change publishes `data-current` on its rows and focuses its first row: in the split layout its first added line in the new pane, or its first removed line when it adds none. The current change resets when either text changes; the state that follows a comparison keeps one setter while the comparison stays the same.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/components/text-diff/text-diff-table.tsx`, `src/core/strings/diff.ts`, `src/utils/use-state-for.ts`
Verification: `src/components/text-diff/text-diff.test.tsx`, `src/utils/use-state-for.test.ts`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-2.3 - Keyboard

While focus is inside the diff, `n` shall move to the next change and `p` to the previous one, as the buttons do. Keys pressed with Alt, Control or Meta, inside a line widget, or in a text input, select or editable element are left alone.

Implementation: `src/components/text-diff/text-diff.tsx`
Verification: `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

## UIC-TEXT-DIFF-3 - Accessibility

### UIC-TEXT-DIFF-3.1 - Rows that read as changes

Each line row's marker cell shall show `+` or `−` hidden from assistive technology beside the provider's `textDiffLine` string, visually hidden, which names the change and the line's numbers on the sides the table draws (`Added, new line 12`; `Unchanged, old line 3, new line 5`). The number cells' digits are hidden from assistive technology, an added or removed line's text is a native `<ins>` or `<del>`, and filler rows are hidden from assistive technology. Line rows take focus only from the navigation (`tabIndex` -1).

Implementation: `src/components/text-diff/text-diff-table.tsx`, `src/core/strings/diff.ts`
Verification: `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-3.2 - Named, focusable panes

The root shall be a `role="group"` taking the caller's labelling props. Each pane's scrolling viewport is a focusable (`tabIndex` 0) `role="group"` named by the provider's `textDiffLines` string in the unified layout, and by its `valueBefore` and `valueAfter` strings for the old and the new pane, so a keyboard reader can scroll it.

Implementation: `src/components/text-diff/text-diff.tsx`, `src/core/strings/diff.ts`, `src/core/strings/history.ts`
Verification: `src/components/text-diff/text-diff.test.tsx`, `e2e/text-diff.spec.ts`

### UIC-TEXT-DIFF-3.3 - Hooks and caller attributes

`TextDiff` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref`, caller `data-*` attributes and labelling props to its root.

Implementation: `src/components/text-diff/text-diff.tsx`
Verification: `src/components/text-diff/text-diff.test.tsx`

## Hooks

| Hook                       | Kind      | Values                          | Description                                                                         |
| -------------------------- | --------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `ui-text-diff`             | root      |                                 | The `role="group"` element holding the header and the panes.                        |
| `ui-text-diff__header`     | slot      |                                 | The summary and the navigation.                                                     |
| `ui-text-diff__summary`    | slot      |                                 | The added and removed counts.                                                       |
| `ui-text-diff__count`      | slot      |                                 | One count, `+n` or `−n`.                                                            |
| `ui-text-diff__navigation` | slot      |                                 | The previous and next change buttons.                                               |
| `ui-text-diff__previous`   | slot      |                                 | The previous change button (also `ui-button`).                                      |
| `ui-text-diff__next`       | slot      |                                 | The next change button (also `ui-button`).                                          |
| `ui-text-diff__panes`      | slot      |                                 | The two panes of the split layout.                                                  |
| `ui-text-diff__pane`       | slot      |                                 | A scrolling pane (also `ui-scroll-region`).                                         |
| `ui-text-diff__table`      | slot      |                                 | A pane's `<table>` of rows.                                                         |
| `ui-text-diff__line`       | slot      |                                 | A line's row.                                                                       |
| `ui-text-diff__filler`     | slot      |                                 | An empty row padding the shorter side of a split change.                            |
| `ui-text-diff__number`     | slot      |                                 | A line number cell.                                                                 |
| `ui-text-diff__marker`     | slot      |                                 | The cell with the `+` or `−` mark and the row's hidden description.                 |
| `ui-text-diff__content`    | slot      |                                 | The cell with the line's text.                                                      |
| `ui-text-diff__text`       | slot      |                                 | The line's text: `<ins>`, `<del>` or `<span>`.                                      |
| `ui-text-diff__word`       | slot      |                                 | A run of words a paired line changed.                                               |
| `ui-text-diff__fold`       | slot      |                                 | The row standing for folded unchanged lines.                                        |
| `ui-text-diff__expand`     | slot      |                                 | The button that shows folded lines (also `ui-button`).                              |
| `ui-text-diff__widget`     | slot      |                                 | The row of a line widget.                                                           |
| `data-layout`              | attribute | `unified`, `split`              | On the root: one column or two panes.                                               |
| `data-side`                | state     | `old`, `new`, `both`            | On a pane (`old`, `new` or `both`) or a number cell (`old`, `new`): the side shown. |
| `data-change`              | state     | `added`, `removed`, `unchanged` | On a line row (`added`, `removed`, `unchanged`) or a count (`added`, `removed`).    |
| `data-current`             | state     | `true`                          | On the rows of the change the reader moved to.                                      |
