---
'@flamboyantengineer/ui-components': minor
---

Fix the data findings from the second library review.

- Table: `onCellEdit` is removed; `onCellsChange` reports every change of cell values, an editor's commit as a batch of one. Undo applies a bulk edit of a column that only offers `bulkEdit`. Range and fill drags carry on while the host passes fresh arrays of the same rows and columns. Unticking one row of a selection of all keeps the rows on other pages selected. Content-sized columns no longer measure on every render or focus move and copy only their own cells. Cell content draws again only when its row or column changes. Starting a keyboard drag no longer does quadratic work. The static resizer follows a value set by assistive technology. A resize stores only the widths the reader set. A double click on a control in an editable cell stays the control's, AltGr typing opens the editor, the selection bar draws no Clear under `disallowEmptySelection`, and pinned column and row probes keep their observers across renders.
- Filter Bar and Condition Builder: a date value must be a real day and a range must run in order to count as complete; text matching folds case and composition the same in every locale.
- Description List: a number range with an end that is not finite joins its ends instead of throwing.
- Relation Columns: the trail is named by the caller's labelling elements.
- Relation Matrix and Permission Matrix: a scroll, an arrow key or a grant change draws again only the cells it changes.
