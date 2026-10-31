# Redline Compare

`RedlineCompare` compares two rich documents block by block (two revisions of a specification, a contract or a report) and draws a redline: inserted and deleted words inline, changed block kinds and formatting noted, moved blocks linked between their two positions, in one column or side by side. A header counts the changes and steps between them, and each change can be accepted or rejected, reported to the caller as plain data. Documents come in a library-owned block model (`DocumentBlock`), so callers convert their editor's documents into it; the alignment is the pure function `compareBlocks`, which hosts can also call on their own.

## UIC-REDLINE-COMPARE-1 - Alignment

### UIC-REDLINE-COMPARE-1.1 - Blocks matched by id or text

`compareBlocks(oldBlocks, newBlocks)` shall take two lists of blocks (`DocumentBlock`: a `type` among `paragraph`, `heading`, `list-item`, `quote` and `code`, an optional `level`, the `text`, optional inline `marks` and an optional `id` unique within its document) and return `{ rows, counts }`, where `rows` are aligned rows (`ComparedBlockRow`) in reading order, each with a unique `key`, its `change`, the `oldBlock` and `newBlock` it holds, their `oldIndex` and `newIndex` in the inputs, and the flags below. Blocks match by `id`, or by equal text when they have none, on the longest common run of matches ([UIC-DIFF-3.1](DIFF.md#uic-diff-31---hunks-of-items)); a match is one row holding both blocks, `unchanged`, or `changed` with the word diff of their texts in `words` ([UIC-DIFF-2.1](DIFF.md#uic-diff-21---hunks-of-text)) when the texts differ. Numeric and string ids are distinct, including ids with delimiter-like text. Row keys are opaque: keyed rows use `id:` followed by the JSON encoding of the id type and its string value; hosts use the returned keys for decisions and counterparts.

Implementation: `src/utils/compare-blocks.ts`, `src/utils/diff.ts`
Verification: `src/utils/compare-blocks.test.ts`

### UIC-REDLINE-COMPARE-1.2 - Added, removed and rewritten blocks

Between two matches, a block without an id on each side whose texts share at least half their characters shall pair in order into one `changed` row with its word diff; blocks with ids never pair with another id. A block only the new document holds is an `added` row and one only the old document holds a `removed` row; ahead of each pair come the removed and then the added blocks before it. Pairing shall scan the remaining candidate positions directly and retain those positions while emitting rows, without copying suffix arrays or searching already paired prefixes. A candidate whose length, or whose words shared with the deleted block (as often as both hold them), cannot reach half the characters is skipped without a word diff, and each deleted block runs at most eight word diffs against candidates; one that finds no similar block among them stays `removed`. A rewritten document of a few hundred blocks without ids therefore runs a few thousand word diffs at most, not one per pair of blocks.

Implementation: `src/utils/compare-blocks.ts`, `src/utils/diff.ts`
Verification: `src/utils/compare-blocks.test.ts`, `src/utils/compare-blocks-budget.test.ts`, `e2e/redline-compare.spec.ts`

### UIC-REDLINE-COMPARE-1.3 - Moved blocks

A block deleted between two matches and inserted elsewhere with the same id, or the same non-blank text when it has none, shall be `moved` and appear twice: at its old position as a row holding only the old block with `move: 'from'`, and at its new position as a row holding both blocks with `move: 'to'` and the word diff when the texts differ. Each names the other in `counterpartKey`. Repeated non-blank paragraphs shall pair their old and new positions in reading order, with move buckets built and consumed without repeatedly copying or shifting their contents.

Implementation: `src/utils/compare-blocks.ts`
Verification: `src/utils/compare-blocks.test.ts`

### UIC-REDLINE-COMPARE-1.4 - Kind and format changes

A row holding both blocks shall set `isTypeChanged` when their `type` or `level` differ, and `isFormatChanged` when their texts are equal and their non-empty marks differ in kind, range or link destination; either makes a matched row `changed`. `counts` holds the number of `added`, `removed`, `changed` and `moved` blocks, a moved block counting once.

Implementation: `src/utils/compare-blocks.ts`
Verification: `src/utils/compare-blocks.test.ts`

## UIC-REDLINE-COMPARE-2 - Rows

### UIC-REDLINE-COMPARE-2.1 - Inline layout

`RedlineCompare` shall compare `oldBlocks` and `newBlocks` with `compareBlocks` and draw one `ui-redline-compare__row` list item per row in an ordered list (`ui-redline-compare__rows`), publishing `data-change` and, for a moved block, `data-move` (`from` or `to`). With `layout="inline"` (the default) a row has one cell (`ui-redline-compare__cell`, `data-side="both"`) holding its block (`ui-redline-compare__block`, `data-type` and `data-level`): kept words as text, deleted words in a `<del>` and inserted words in an `<ins>` (`ui-redline-compare__word`, `data-change` `removed` or `added`). An added block draws whole in an `<ins>`, a removed block whole in a `<del>`, and a moved block's old position its old text. The root publishes `data-layout`.

Implementation: `src/components/redline-compare/redline-compare.tsx`, `src/components/redline-compare/redline-row.tsx`, `src/components/redline-compare/redline-text.ts`, `src/components/redline-compare/redline-compare-parts.tsx`
Verification: `src/components/redline-compare/redline-compare.test.tsx`, `src/components/redline-compare/redline-text.test.ts`, `e2e/redline-compare.spec.ts`

### UIC-REDLINE-COMPARE-2.2 - Split layout

With `layout="split"` each row shall have an old cell (`data-side="old"`) holding the old block with its kept and deleted words, and a new cell (`data-side="new"`) holding the new block with its kept and inserted words, side by side on the same row. A cell whose side does not hold the row's block, such as the old cell of an added block or of a moved block's new position, is empty with `data-empty`. Above the rows, `ui-redline-compare__columns` holds the column labels (`ui-redline-compare__column-label`, `data-side`), `oldLabel` and `newLabel`, by default the provider's `valueBefore` and `valueAfter` strings, hidden from assistive technology since the inserted and deleted words already say which side they belong to.

Implementation: `src/components/redline-compare/redline-compare.tsx`, `src/components/redline-compare/redline-row.tsx`, `src/components/redline-compare/redline-text.ts`
Verification: `src/components/redline-compare/redline-compare.test.tsx`, `src/components/redline-compare/redline-text.test.ts`, `e2e/redline-compare.spec.ts`

### UIC-REDLINE-COMPARE-2.3 - Inline marks

A block's text shall draw its marks over kept, inserted and deleted words alike, each as `ui-redline-compare__mark` with `data-mark`: `bold` in `<strong>`, `italic` in `<em>`, `underline` in `<u>`, `strike` in `<s>`, `code` in `<code>`, and `link` as an anchor to its `href` through the provider's link renderer ([UIC-PROVIDER-5.1](PROVIDER.md#uic-provider-51---link-renderer)), or a `<span>` when the destination is missing or not a safe URL ([MARKUP.md](MARKUP.md)). Overlapping marks nest, links outermost and code innermost; deleted words take the old block's marks and kept and inserted words the new block's.

Implementation: `src/components/redline-compare/redline-text.ts`, `src/components/redline-compare/redline-compare-parts.tsx`, `src/utils/safe-url.ts`
Verification: `src/components/redline-compare/redline-text.test.ts`, `src/components/redline-compare/redline-compare.test.tsx`

### UIC-REDLINE-COMPARE-2.4 - Change markers and notes

Each row shall start with a `ui-redline-compare__marker` (`data-change`) drawing the `edit`, `plus`, `minus` or `move` glyph for a difference and a visually hidden description from the provider's `redlineRow` string: how the block changed (`moved-from` and `moved-to` for a moved block's positions) and its kind from `redlineBlockType`. Under the cells, `ui-redline-compare__notes` holds a `ui-redline-compare__note` with `data-note="type"` reading `redlineTypeChange` with the old and new kinds when the kind or level changed, one with `data-note="format"` reading `redlineFormatChange` when only the formatting changed, and on a moved block's rows a `ui-redline-compare__jump` link button (`redlineGoToNewPosition` at the old position, `redlineGoToOldPosition` at the new one) that moves focus to the row at the other position.

Implementation: `src/components/redline-compare/redline-row.tsx`, `src/components/redline-compare/redline-compare-parts.tsx`, `src/core/strings/redline.ts`, `src/core/glyphs.tsx`
Verification: `src/components/redline-compare/redline-compare.test.tsx`, `e2e/redline-compare.spec.ts`

## UIC-REDLINE-COMPARE-3 - Navigation and decisions

### UIC-REDLINE-COMPARE-3.1 - Summary and stepping between changes

The header (`ui-redline-compare__header`) shall hold a summary paragraph (`ui-redline-compare__summary`) reading the provider's `redlineSummary` with the counts, and the `ui-redline-compare__previous` and `ui-redline-compare__next` icon buttons (`redlinePreviousChange`, `redlineNextChange`). They, and `p` and `n` pressed anywhere in the compare outside a text input, move focus to the previous or next change (every row that differs, a moved block once at its new position), scroll it into view and mark it `data-current`; the first press of next reaches the first change, and each button is disabled where there is no change to move to. Changing the documents forgets the current change.

Implementation: `src/components/redline-compare/redline-compare.tsx`, `src/components/redline-compare/redline-compare-parts.tsx`
Verification: `src/components/redline-compare/redline-compare.test.tsx`, `e2e/redline-compare.spec.ts`

### UIC-REDLINE-COMPARE-3.2 - Accepting and rejecting changes

With `onResolve`, each change row shall draw `ui-redline-compare__actions` with the `ui-redline-compare__accept` and `ui-redline-compare__reject` buttons (`redlineAccept`, `redlineReject`), described by the row's marker. A press calls `onResolve({ decision, row })` with `accepted` or `rejected` and the row's plain data, unless that decision is already taken; the decided button is selected (`aria-pressed`, `data-selected`) and the row publishes `data-resolution`. Decisions are controlled by `resolutions` (by row key) or kept by the compare until the documents change. Without `onResolve` no buttons draw; the compare never changes the documents itself.

Implementation: `src/components/redline-compare/redline-compare.tsx`, `src/components/redline-compare/redline-row.tsx`
Verification: `src/components/redline-compare/redline-compare.test.tsx`, `e2e/redline-compare.spec.ts`

## UIC-REDLINE-COMPARE-4 - Accessibility and hooks

### UIC-REDLINE-COMPARE-4.1 - Accessible compare

The root shall be a group named by `aria-label` or `aria-labelledby`, by default the provider's `redlineComparison` string, and take `aria-describedby` and `aria-details`. Rows are focusable from script only (`tabIndex` -1), so Tab moves between the header and decision buttons; the lab passes axe in the light and dark reference themes.

Implementation: `src/components/redline-compare/redline-compare.tsx`
Verification: `src/components/redline-compare/redline-compare.test.tsx`, `e2e/redline-compare.spec.ts`

### UIC-REDLINE-COMPARE-4.2 - Hooks and caller attributes

`RedlineCompare` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root.

Implementation: `src/components/redline-compare/redline-compare.tsx`
Verification: `src/components/redline-compare/redline-compare.test.tsx`

## Hooks

| Hook                               | Kind      | Values                                                  | Description                                                                  |
| ---------------------------------- | --------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui-redline-compare`               | root      |                                                         | The `<div>` around the header, the column labels and the rows.               |
| `ui-redline-compare__header`       | slot      |                                                         | The summary and the step buttons.                                            |
| `ui-redline-compare__summary`      | slot      |                                                         | The counts of changed blocks.                                                |
| `ui-redline-compare__navigation`   | slot      |                                                         | The previous and next buttons.                                               |
| `ui-redline-compare__previous`     | slot      |                                                         | The button that moves to the previous change.                                |
| `ui-redline-compare__next`         | slot      |                                                         | The button that moves to the next change.                                    |
| `ui-redline-compare__columns`      | slot      |                                                         | The column labels of a split compare.                                        |
| `ui-redline-compare__column-label` | slot      |                                                         | One column's label.                                                          |
| `ui-redline-compare__rows`         | slot      |                                                         | The ordered list of rows.                                                    |
| `ui-redline-compare__row`          | slot      |                                                         | One aligned row.                                                             |
| `ui-redline-compare__marker`       | slot      |                                                         | The row's change glyph and spoken description.                               |
| `ui-redline-compare__cell`         | slot      |                                                         | One side of a row, or its single inline cell.                                |
| `ui-redline-compare__block`        | slot      |                                                         | A block's text.                                                              |
| `ui-redline-compare__word`         | slot      |                                                         | An `<ins>` or `<del>` of inserted or deleted words.                          |
| `ui-redline-compare__mark`         | slot      |                                                         | An inline mark over a run of text.                                           |
| `ui-redline-compare__notes`        | slot      |                                                         | The notes and jump button under a row.                                       |
| `ui-redline-compare__note`         | slot      |                                                         | A note on a changed kind or changed formatting.                              |
| `ui-redline-compare__jump`         | slot      |                                                         | A moved block's button to its other position.                                |
| `ui-redline-compare__actions`      | slot      |                                                         | The accept and reject buttons of a change.                                   |
| `ui-redline-compare__accept`       | slot      |                                                         | The button that accepts a change.                                            |
| `ui-redline-compare__reject`       | slot      |                                                         | The button that rejects a change.                                            |
| `data-layout`                      | attribute | `inline`, `split`                                       | On the root: one column or side by side.                                     |
| `data-change`                      | attribute | `unchanged`, `changed`, `added`, `removed`, `moved`     | On rows and markers: the kind of difference; on words, `added` or `removed`. |
| `data-move`                        | attribute | `from`, `to`                                            | On a moved block's rows: its old or new position.                            |
| `data-current`                     | state     | `true`                                                  | On the change the reader stepped to.                                         |
| `data-resolution`                  | state     | `accepted`, `rejected`                                  | On a change row once it is decided.                                          |
| `data-side`                        | attribute | `old`, `new`, `both`                                    | On cells and column labels: which document.                                  |
| `data-empty`                       | state     | `true`                                                  | On a cell whose side does not hold the row's block.                          |
| `data-type`                        | attribute | `paragraph`, `heading`, `list-item`, `quote`, `code`    | On blocks: the block's kind.                                                 |
| `data-level`                       | attribute |                                                         | On blocks: a heading's level or a list item's depth.                         |
| `data-mark`                        | attribute | `bold`, `italic`, `underline`, `strike`, `code`, `link` | On marks: the mark's kind.                                                   |
| `data-note`                        | attribute | `type`, `format`                                        | On notes: what changed.                                                      |
