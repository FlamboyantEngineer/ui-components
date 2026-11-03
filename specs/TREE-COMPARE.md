# Tree Compare

`TreeCompare` sets two hierarchies side by side (two versions of a document outline, two configurations of a product structure) and aligns them row by row: each row shows a node's left version and right version, marked added, removed, changed or moved. Both sides share one expansion, a switch keeps only the differences, buttons and F7 step from one difference to the next, a moved node links its two positions, and a summary counts each kind of difference. It renders one [Tree](TREE.md), so the rows keep the tree grid's keyboard model, and aligns the hierarchies with the pure function `compareTrees`, which hosts can also call on their own.

## UIC-TREE-COMPARE-1 - Alignment

### UIC-TREE-COMPARE-1.1 - Nodes matched by id

`compareTrees(left, right, options)` shall take two lists of nodes (`CompareTreeNode`: an `id` unique within its tree, a `label` and optional `children` of the same type) and return `{ rows, counts }`, where `rows` are aligned rows (`ComparedTreeRow`) nested like the trees, each with a unique `id`, the `nodeId` it shows, its `left` and `right` nodes where it shows them, its `change` and its child rows. Sibling lists are aligned on their longest common run of ids ([UIC-DIFF-3.1](DIFF.md#uic-diff-31---hunks-of-items)); a node both lists hold in that run is one row holding both nodes, `unchanged` when `options.isEqual(left, right)` holds (equal labels by default) and `changed` otherwise, and its children are aligned under it. Indexing and alignment shall handle twenty thousand nested nodes without recursive calls; equality callbacks keep depth-first reading order.

Implementation: `src/utils/compare-trees.ts`, `src/utils/diff.ts`
Verification: `src/utils/compare-trees.test.ts`

### UIC-TREE-COMPARE-1.2 - Added and removed nodes

A node only the right tree holds shall be an `added` row holding the right node, and a node only the left tree holds a `removed` row holding the left node, each with its subtree aligned below it the same way. Where two sibling lists differ, the left-only rows come before the right-only rows.

Implementation: `src/utils/compare-trees.ts`
Verification: `src/utils/compare-trees.test.ts`

### UIC-TREE-COMPARE-1.3 - Moved nodes

A node both trees hold under another parent, or out of order among the same siblings, shall be `moved` and appear twice: at its old position as a row holding only the left node, with no child rows and the id `moved-from:<id>`, and at its new position as a row holding only the right node, with the node's left and right children aligned below it. Each row names the other in `counterpartId`. A node and its parent that swap places still give a finite list of rows. If a generated old-position id collides with an input or generated row id, it shall receive the first unused suffix `:2`, `:3`, and so on; both counterparts keep the allocated identity.

Implementation: `src/utils/compare-trees.ts`
Verification: `src/utils/compare-trees.test.ts`

### UIC-TREE-COMPARE-1.4 - Counts

`counts` shall hold the number of `added`, `removed`, `changed` and `moved` nodes, a moved node counting once.

Implementation: `src/utils/compare-trees.ts`
Verification: `src/utils/compare-trees.test.ts`

## UIC-TREE-COMPARE-2 - Rows

### UIC-TREE-COMPARE-2.1 - Aligned rows

`TreeCompare` shall compare `left` and `right` with `compareTrees` (passing `isEqual`) and render the aligned rows in a [Tree](TREE.md) (also `ui-tree-compare__tree`), one row per aligned row. Each row's label holds a `ui-tree-compare__row` with the left cell, a change marker and the right cell (`ui-tree-compare__cell` with `data-side` `left` or `right`); a side the row does not show is an empty cell with `data-empty`. A cell shows `renderLabel(node, side)`, the node's `label` by default. Above the tree, `ui-tree-compare__header` holds the two column labels (`ui-tree-compare__column-label`, `data-side`), `leftLabel` and `rightLabel`, by default the provider's `valueBefore` and `valueAfter` strings.

Implementation: `src/components/tree-compare/tree-compare.tsx`, `src/components/tree-compare/tree-compare-parts.tsx`
Verification: `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

### UIC-TREE-COMPARE-2.2 - Change marks

Each row shall publish its change as `data-change` (`unchanged`, `added`, `removed`, `changed` or `moved`) on `ui-tree-compare__row` and on its `ui-tree-compare__marker`, which draws the `plus`, `minus`, `edit` or `move` glyph for a difference and nothing for an unchanged row. The row's accessible name and typeahead text say the difference: the label alone when unchanged, else the provider's `treeAddedRow`, `treeRemovedRow`, `treeChangedRow` (with the old label when it differs), `treeMovedAwayRow` or `treeMovedHereRow` string.

Implementation: `src/components/tree-compare/tree-compare-parts.tsx`, `src/components/tree-compare/tree-compare-rows.ts`, `src/core/strings/structure.ts`, `src/core/glyphs.tsx`
Verification: `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

### UIC-TREE-COMPARE-2.3 - Indentation on both sides

Both cells of a row shall indent from the row's `--ui-tree-level`, so each side reads as its own hierarchy. The tree's expand button serves the row on the left; the right cell of a row with child rows repeats its glyph (`ui-tree-compare__branch`, `chevron-down`, or while collapsed a chevron pointing to the inline end: `chevron-right`, `chevron-left` right to left), decoratively.

Implementation: `src/components/tree-compare/tree-compare-parts.tsx`, `labs/reference/tree-compare.css`
Verification: `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

## UIC-TREE-COMPARE-3 - Expansion and filtering

### UIC-TREE-COMPARE-3.1 - One expansion for both sides

Expanding or collapsing a row shall show or hide its child rows on both sides at once, from the expand button, ArrowRight and ArrowLeft, or pressing a row with child rows. The expanded rows are controlled with `expandedKeys` and `onExpandedChange` (row ids), or uncontrolled from `defaultExpandedKeys`; without it every row with a difference below it starts expanded. Uncontrolled expansion starts over in the same way whenever the content of `left` or `right` changes, so a parent that rebuilds equal trees on each render keeps it (each node's own fields compared shallowly and its children in order without recursion, including twenty thousand nested rebuilt nodes, `isSameTrees`), while a changed node starts it over, so a comparison whose second tree arrives later shows its differences; a new `isEqual` alone keeps it. Expansion and row indexing shall traverse deep rows iteratively and store one immediate parent link per child instead of copying every ancestor path. The twenty-thousand-level guarantee applies to the comparison, equality and row-model helpers. The rendered widget uses React Aria's nested collection, whose depth is bounded by React's recursive commit stack. Every expanded row renders and the tree is not virtualized: stepping between differences and jumping to a moved node's twin focus rows in the document. By default only the rows above a difference are expanded and "Only differences" hides unchanged branches, so the rows drawn stay within a few thousand for hierarchies of any size the reader can review side by side.

Implementation: `src/components/tree-compare/tree-compare.tsx`, `src/components/tree-compare/tree-compare-rows.ts`, `src/utils/compare-trees.ts`
Verification: `src/components/tree-compare/tree-compare-rows.test.ts`, `src/components/tree-compare/tree-compare.test.tsx`, `src/utils/compare-trees.test.ts`, `e2e/tree-compare.spec.ts`

### UIC-TREE-COMPARE-3.2 - Only differences

The `ui-tree-compare__changes-only` [Switch](SWITCH.md), named by the provider's `treeChangesOnly` string, shall keep only the rows that differ and the rows above them, hiding unchanged rows with no difference below. It is controlled with `changesOnly` and `onChangesOnlyChange`, or uncontrolled from `defaultChangesOnly` (off), and the root publishes `data-changes-only` while it is on. A comparison with no rows to show reads the provider's `treeNoDifferences` string in the tree's empty state. Filtering shall retain deep ancestor context without recursive calls.

Implementation: `src/components/tree-compare/tree-compare.tsx`, `src/components/tree-compare/tree-compare-rows.ts`
Verification: `src/components/tree-compare/tree-compare-rows.test.ts`, `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

## UIC-TREE-COMPARE-4 - Navigation

### UIC-TREE-COMPARE-4.1 - Stepping between differences

The `ui-tree-compare__previous` and `ui-tree-compare__next` icon buttons (the provider's `treePreviousChange` and `treeNextChange` strings), and Shift+F7 and F7 in a row, shall move focus to the previous or the next row with a difference in reading order, starting from the row last focused and wrapping around at either end, expanding the rows above it first and scrolling it into view. Both buttons are disabled while the trees do not differ. A step shall scan the indexed order directly without allocating filtered or reversed row arrays.

Implementation: `src/components/tree-compare/tree-compare.tsx`, `src/components/tree-compare/use-tree-compare-navigation.ts`, `src/components/tree-compare/tree-compare-rows.ts`
Verification: `src/components/tree-compare/tree-compare-rows.test.ts`, `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

### UIC-TREE-COMPARE-4.2 - Moved rows link their positions

Each moved row shall draw a `ui-tree-compare__jump` icon button in the tree's actions slot, named by the provider's `treeGoToNewPosition` string at the old position and `treeGoToOldPosition` at the new one, which moves focus to the row at the node's other position, expanding the rows above it first. Pressing the moved row or pressing Enter on it does the same.

Implementation: `src/components/tree-compare/tree-compare.tsx`, `src/components/tree-compare/tree-compare-parts.tsx`, `src/components/tree-compare/use-tree-compare-navigation.ts`
Verification: `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

## UIC-TREE-COMPARE-5 - Summary

### UIC-TREE-COMPARE-5.1 - Counts of each difference

The toolbar (`ui-tree-compare__toolbar`) shall start with a summary: a list (`ui-tree-compare__summary`) with one item (`ui-tree-compare__count`, `data-change`) per kind of difference that occurs, in the order added, removed, changed, moved, reading the provider's `treeAddedCount`, `treeRemovedCount`, `treeChangedCount` and `treeMovedCount` strings, or, when the trees do not differ, a paragraph of the same slot reading `treeNoDifferences`.

Implementation: `src/components/tree-compare/tree-compare-parts.tsx`, `src/core/strings/structure.ts`
Verification: `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

## UIC-TREE-COMPARE-6 - Accessibility and hooks

### UIC-TREE-COMPARE-6.1 - Accessible tree

The tree shall be named by `aria-label` or `aria-labelledby`, by default the provider's `treeComparison` string, take `aria-describedby` and `aria-details`, and keep the tree grid's keyboard model ([UIC-TREE-3.1](TREE.md#uic-tree-31---keyboard-navigation)); the lab passes axe in the light and dark reference themes.

Implementation: `src/components/tree-compare/tree-compare.tsx`
Verification: `src/components/tree-compare/tree-compare.test.tsx`, `e2e/tree-compare.spec.ts`

### UIC-TREE-COMPARE-6.2 - Hooks and caller attributes

`TreeCompare` shall carry the hooks below beside the tree's, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root.

Implementation: `src/components/tree-compare/tree-compare.tsx`
Verification: `src/components/tree-compare/tree-compare.test.tsx`

## Hooks

| Hook                            | Kind      | Values                                              | Description                                                     |
| ------------------------------- | --------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `ui-tree-compare`               | root      |                                                     | The `<div>` around the toolbar, the column labels and the tree. |
| `ui-tree-compare__toolbar`      | slot      |                                                     | The summary, the filter switch and the step buttons.            |
| `ui-tree-compare__summary`      | slot      |                                                     | The list of counts, or the note that nothing differs.           |
| `ui-tree-compare__count`        | slot      |                                                     | One count in the summary.                                       |
| `ui-tree-compare__changes-only` | slot      |                                                     | The switch that keeps only differences.                         |
| `ui-tree-compare__previous`     | slot      |                                                     | The button that steps to the previous difference.               |
| `ui-tree-compare__next`         | slot      |                                                     | The button that steps to the next difference.                   |
| `ui-tree-compare__header`       | slot      |                                                     | The row of column labels.                                       |
| `ui-tree-compare__column-label` | slot      |                                                     | One column's label.                                             |
| `ui-tree-compare__tree`         | slot      |                                                     | The tree of aligned rows.                                       |
| `ui-tree-compare__row`          | slot      |                                                     | A row's two cells and marker, inside the tree row's label.      |
| `ui-tree-compare__cell`         | slot      |                                                     | One side of a row.                                              |
| `ui-tree-compare__marker`       | slot      |                                                     | The change glyph between the two cells.                         |
| `ui-tree-compare__branch`       | slot      |                                                     | The right cell's decorative expand glyph.                       |
| `ui-tree-compare__jump`         | slot      |                                                     | A moved row's button to its other position.                     |
| `data-changes-only`             | state     | `true`                                              | On the root while only differences show.                        |
| `data-change`                   | attribute | `unchanged`, `added`, `removed`, `changed`, `moved` | On rows, markers and counts: the kind of difference.            |
| `data-side`                     | attribute | `left`, `right`                                     | On cells and column labels: which tree.                         |
| `data-empty`                    | state     | `true`                                              | On a cell whose side does not show the row's node.              |
