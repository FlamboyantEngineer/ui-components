# Merge View

`MergeView` resolves the three-way merge of two texts that changed a common base: our side, the base and their side are drawn level with each other, and a result pane holds the merged text, where clean changes are already applied and each conflict offers take actions and an editable result. A header counts the unresolved conflicts and moves between them, and every pane scrolls with the others. It builds on `mergeThreeWay` ([UIC-DIFF-4](DIFF.md#uic-diff-4---three-way-merge)), [Scroll Region](SCROLL-REGION.md) panes, [Synced Scroll](SYNCED-SCROLL.md), [Text Field](TEXT-FIELD.md) editors and [Buttons](BUTTON.md). [Text Diff](TEXT-DIFF.md) is the two-way counterpart.

## UIC-MERGE-VIEW-1 - Panes

### UIC-MERGE-VIEW-1.1 - Structure

`MergeView` shall render a root `role="group"` (`ui-merge-view`) taking the caller's labelling props, holding the header, a `ui-merge-view__sides` element with the input panes, and the result pane. Each pane is a `ui-merge-view__side` with `data-side` (`ours`, `base`, `theirs` or `result`), holding a `ui-merge-view__title` and a [Scroll Region](SCROLL-REGION.md) (`ui-merge-view__pane`, scrolling both ways) whose viewport is a focusable (`tabIndex` 0) `role="group"` named by the title. The titles read `oursLabel`, `baseLabel` and `theirsLabel`, or the provider's `mergeViewOurs`, `mergeViewBase` and `mergeViewTheirs` strings, and `mergeViewResult` for the result. The base pane draws between the two sides while `showBase` is true (the default), published as `data-show-base`.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/components/merge-view/merge-view-sides.tsx`, `src/core/analysis-strings.ts`
Verification: `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-1.2 - Chunks and lines

`MergeView` shall merge `base`, `ours` and `theirs` with `mergeThreeWay` and draw each input pane as a table (`ui-merge-view__table`) with one body per chunk (`ui-merge-view__chunk`, publishing the chunk's `kind` as `data-kind`). A body holds the side's lines of the chunk as rows (`ui-merge-view__line`) of a `ui-merge-view__number` cell with the line's 1-based number in the side's text, a `ui-merge-view__marker` cell and a `ui-merge-view__content` cell with its text, then empty `ui-merge-view__filler` rows up to the most lines any side has in the chunk, so every pane draws as many rows for a chunk. A line publishes `data-change`: `conflict` in a conflict, `changed` for the base's lines of a clean change and for the lines of the side (or both sides) that made it, and `unchanged` otherwise.

Implementation: `src/components/merge-view/merge-view-sides.tsx`, `src/components/merge-view/merge-blocks.ts`
Verification: `src/components/merge-view/merge-blocks.test.ts`, `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-1.3 - Panes scroll together

Every pane shall scroll vertically with the others through `useSyncedScroll` with matched anchors ([UIC-SYNCED-SCROLL-1.2](SYNCED-SCROLL.md#uic-synced-scroll-12---matched-anchors)): each chunk's body in the input panes and its block in the result pane, matched by their order, so the panes meet at every chunk even where a conflict's editor is taller than its rows. Each pane scrolls horizontally on its own.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/utils/use-synced-scroll.ts`
Verification: `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

## UIC-MERGE-VIEW-2 - Result

### UIC-MERGE-VIEW-2.1 - Clean chunks

The result pane shall hold a `ui-merge-view__blocks` element with one `ui-merge-view__block` per chunk, publishing its `data-kind`. A clean chunk's block holds a `<pre>` (`ui-merge-view__text`) with the lines it merges to: the lines of the side that changed it, the shared change of both sides, or the base where no side changed it.

Implementation: `src/components/merge-view/merge-view-result.tsx`, `src/components/merge-view/merge-blocks.ts`
Verification: `src/components/merge-view/merge-blocks.test.ts`, `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-2.2 - Conflict blocks

A conflict's block shall be a `role="group"` named by its `ui-merge-view__conflict-title`, which reads the provider's `mergeViewConflict` string with its position (`Conflict 2 of 3`), and publish `data-resolution`: `unresolved`, `ours`, `theirs`, `both`, `base` or `edited`. Its `ui-merge-view__conflict-header` also holds a `ui-merge-view__resolution` reading `mergeViewUnresolved` or `mergeViewResolved`, and a `ui-merge-view__actions` element of four `ui-merge-view__take` Buttons (`data-take` `ours`, `theirs`, `both`, `base`) named by `mergeViewTake` with each side's title and by `mergeViewTakeBoth`. Under the header, a multiline Text Field (`ui-merge-view__editor`) named by `mergeViewConflictResult` holds the conflict's result: while unresolved, our lines and their lines between conflict markers (`<<<<<<<` with our title, `=======`, `>>>>>>>` with their title).

Implementation: `src/components/merge-view/merge-view-result.tsx`, `src/components/merge-view/merge-blocks.ts`, `src/core/analysis-strings.ts`
Verification: `src/components/merge-view/merge-blocks.test.ts`, `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-2.3 - Take actions

Pressing a take action shall resolve the conflict with that action, and its editor then holds our lines (`ours`), their lines (`theirs`), our lines followed by theirs (`both`) or the base's lines (`base`). Another take action replaces the resolution.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/components/merge-view/merge-blocks.ts`, `src/components/merge-view/use-merge-state.ts`, `src/components/merge-view/merge-view-result.tsx`
Verification: `src/components/merge-view/merge-blocks.test.ts`, `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-2.4 - Editable result

Editing a conflict's editor shall resolve the conflict as `edited`, its text becoming the conflict's result, whatever it holds. A take action afterwards replaces the edited text. Typing in the editor redraws neither the input sides nor the result's clean chunks, so it stays quick in a long text.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/components/merge-view/merge-view-result.tsx`, `src/components/merge-view/merge-view-sides.tsx`
Verification: `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-2.5 - Result and resolution state

After each take action or edit, `onChange` shall be called with `text`, the clean chunks' lines and each conflict's result in order (an empty result adding no line), ending with a line break when `ours` does; `resolutions`, each conflict's resolution in order; and `unresolved`, how many are still unresolved. When `base`, `ours` or `theirs` changes, every conflict starts over unresolved, and each conflict's editor starts over too: its undo history holds nothing from the earlier texts, so undo never brings back an earlier merge's text or resolves a conflict of the new one. Other changes, such as labels, `onChange` or the locale, keep the current resolutions, edits and history.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/components/merge-view/merge-blocks.ts`, `src/components/merge-view/use-merge-state.ts`, `src/components/merge-view/merge-view-result.tsx`
Verification: `src/components/merge-view/merge-blocks.test.ts`, `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

## UIC-MERGE-VIEW-3 - Conflicts

### UIC-MERGE-VIEW-3.1 - Remaining conflicts

A `ui-merge-view__header` shall lead the view with a `role="status"` `ui-merge-view__status` reading the provider's `mergeViewConflictCount` string with the unresolved and total conflicts (`2 of 3 conflicts unresolved`, `All 3 conflicts resolved`, `No conflicts`), so each resolution is announced.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/core/analysis-strings.ts`
Verification: `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-3.2 - Moving between conflicts

A `ui-merge-view__navigation` element in the header shall hold `ui-merge-view__previous` and `ui-merge-view__next` [Icon Buttons](BUTTON.md) named by the provider's `mergeViewPreviousConflict` and `mergeViewNextConflict` strings. Before any move, Next goes to the first conflict and Previous is disabled; Previous is disabled at the first conflict and Next at the last, and both without conflicts. Moving to a conflict makes it current, publishing `data-current` on its bodies in the input panes and on its result block, and focuses its editor; a take action or edit also makes its conflict current. The current conflict resets with the texts.

Implementation: `src/components/merge-view/merge-view.tsx`, `src/components/merge-view/merge-view-sides.tsx`, `src/components/merge-view/merge-view-result.tsx`
Verification: `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

## UIC-MERGE-VIEW-4 - Accessibility

### UIC-MERGE-VIEW-4.1 - Rows that read as changes

Each line's marker cell shall show `•` for a changed line or `!` for a conflict line, hidden from assistive technology, beside the provider's `mergeViewLine` string, visually hidden, naming the change and the line's number (`Conflict, line 4`; `Line 2`). The number cells' digits and the filler rows are hidden from assistive technology.

Implementation: `src/components/merge-view/merge-view-sides.tsx`, `src/core/analysis-strings.ts`
Verification: `src/components/merge-view/merge-view.test.tsx`, `e2e/merge-view.spec.ts`

### UIC-MERGE-VIEW-4.2 - Hooks and caller attributes

`MergeView` shall carry the hooks below, append the caller's `className`, and forward `id`, caller `data-*` attributes and labelling props to its root.

Implementation: `src/components/merge-view/merge-view.tsx`, `labs/reference/merge-view.css`
Verification: `src/components/merge-view/merge-view.test.tsx`

## Hooks

| Hook                             | Kind      | Values                                                   | Description                                                             |
| -------------------------------- | --------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ui-merge-view`                  | root      |                                                          | The `role="group"` element holding the header and the panes.            |
| `ui-merge-view__header`          | slot      |                                                          | The conflict count and the navigation.                                  |
| `ui-merge-view__status`          | slot      |                                                          | The `role="status"` count of unresolved conflicts.                      |
| `ui-merge-view__navigation`      | slot      |                                                          | The previous and next conflict buttons.                                 |
| `ui-merge-view__previous`        | slot      |                                                          | The previous conflict button (also `ui-button`).                        |
| `ui-merge-view__next`            | slot      |                                                          | The next conflict button (also `ui-button`).                            |
| `ui-merge-view__sides`           | slot      |                                                          | The input panes, side by side.                                          |
| `ui-merge-view__side`            | slot      |                                                          | A pane: its title and its scrolling area.                               |
| `ui-merge-view__title`           | slot      |                                                          | A pane's title.                                                         |
| `ui-merge-view__pane`            | slot      |                                                          | A pane's scrolling area (also `ui-scroll-region`).                      |
| `ui-merge-view__table`           | slot      |                                                          | An input pane's `<table>` of lines.                                     |
| `ui-merge-view__chunk`           | slot      |                                                          | The `<tbody>` of one chunk's lines in an input pane.                    |
| `ui-merge-view__line`            | slot      |                                                          | A line's row.                                                           |
| `ui-merge-view__filler`          | slot      |                                                          | An empty row padding a side's chunk to the chunk's row count.           |
| `ui-merge-view__number`          | slot      |                                                          | A line number cell.                                                     |
| `ui-merge-view__marker`          | slot      |                                                          | The cell with the change mark and the row's hidden description.         |
| `ui-merge-view__content`         | slot      |                                                          | The cell with the line's text.                                          |
| `ui-merge-view__blocks`          | slot      |                                                          | The result pane's chunks.                                               |
| `ui-merge-view__block`           | slot      |                                                          | One chunk of the result.                                                |
| `ui-merge-view__text`            | slot      |                                                          | A clean chunk's merged lines (`<pre>`).                                 |
| `ui-merge-view__conflict-header` | slot      |                                                          | A conflict's title, resolution and take actions.                        |
| `ui-merge-view__conflict-title`  | slot      |                                                          | A conflict's title, which names its block.                              |
| `ui-merge-view__resolution`      | slot      |                                                          | Whether a conflict is resolved.                                         |
| `ui-merge-view__actions`         | slot      |                                                          | A conflict's take actions.                                              |
| `ui-merge-view__take`            | slot      |                                                          | A take action (also `ui-button`).                                       |
| `ui-merge-view__editor`          | slot      |                                                          | A conflict's result editor (also `ui-text-field`).                      |
| `data-show-base`                 | attribute | `true`                                                   | On the root while the base pane draws.                                  |
| `data-side`                      | state     | `ours`, `base`, `theirs`, `result`                       | On a pane: the text it shows.                                           |
| `data-kind`                      | state     | `unchanged`, `ours`, `theirs`, `both`, `conflict`        | On a chunk body or a result block: what the chunk holds.                |
| `data-change`                    | state     | `unchanged`, `changed`, `conflict`                       | On a line row: how its side relates to the base there.                  |
| `data-resolution`                | state     | `unresolved`, `ours`, `theirs`, `both`, `base`, `edited` | On a conflict's block: how it was resolved.                             |
| `data-take`                      | state     | `ours`, `theirs`, `both`, `base`                         | On a take action: what it takes.                                        |
| `data-current`                   | state     | `true`                                                   | On the bodies and the result block of the conflict the reader moved to. |
