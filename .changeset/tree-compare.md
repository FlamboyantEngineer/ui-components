---
'@flamboyantengineer/ui-components': minor
---

Add a tree comparison.

- `TreeCompare` (new): two hierarchies (`left`, `right`, nodes `{ id, label, children }`) aligned row by row in one `Tree`, each row showing the left and right node side by side under `leftLabel` and `rightLabel`, marked `added`, `removed`, `changed` (`isEqual`, labels by default) or `moved`; labels through `renderLabel(node, side)`; one expansion for both sides (`expandedKeys`/`defaultExpandedKeys`/`onExpandedChange`, by default every row with a difference below it); an "only differences" switch (`changesOnly`/`defaultChangesOnly`/`onChangesOnlyChange`); previous/next difference buttons and Shift+F7/F7; a button and Enter on a moved row that go to its other position; and a summary of the counts. Hooks: `ui-tree-compare` with `data-changes-only` and its `__toolbar`, `__summary`, `__count`, `__changes-only`, `__previous`, `__next`, `__header`, `__column-label`, `__tree`, `__row`, `__cell`, `__marker`, `__branch` and `__jump` slots, plus `data-change`, `data-side` and `data-empty`.
- `compareTrees(left, right, { isEqual })` (new): the pure keyed tree diff behind it, returning aligned rows (`ComparedTreeRow`, a moved node's old position keyed `moved-from:<id>`) and `counts`.
- `diffSequences(oldItems, newItems)` (new): the Myers diff of two arrays of items compared with `===`, beside `diffLines` and `diffWords`.
- Glyph: `move`. Provider strings: `treeComparison`, `treeChangesOnly`, `treePreviousChange`, `treeNextChange`, `treeGoToNewPosition`, `treeGoToOldPosition`, `treeNoDifferences`, `treeAddedCount`, `treeRemovedCount`, `treeChangedCount`, `treeMovedCount`, `treeAddedRow`, `treeRemovedRow`, `treeChangedRow`, `treeMovedAwayRow` and `treeMovedHereRow`, in a new structure strings module.
