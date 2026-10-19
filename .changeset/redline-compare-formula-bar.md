---
'@flamboyantengineer/ui-components': minor
---

Add a document redline compare and a spreadsheet formula bar.

- `RedlineCompare` (new): compares two rich documents given as library-owned blocks (`DocumentBlock`: `paragraph`, `heading`, `list-item`, `quote` or `code`, with `level`, `text`, inline `marks` and an optional `id`). Inserted and deleted words draw inline in `<ins>` and `<del>`, kind and formatting changes are noted, moved blocks link their two positions, `layout` is `inline` or `split` (`oldLabel`, `newLabel`), the header counts changes and steps between them (buttons, `n` and `p`), and `onResolve` reports each accept or reject as plain data, with `resolutions` to control the decisions. Hooks: `ui-redline-compare` and its slots, `data-layout`, `data-change`, `data-move`, `data-current`, `data-resolution`, `data-side`, `data-empty`, `data-type`, `data-level`, `data-mark`, `data-note`.
- `compareBlocks` (new utility): the pure block alignment behind it, matching blocks by id or text, pairing rewritten blocks, finding moves and flagging kind and format changes.
- `FormulaBar` (new): the active cell's A1 reference, editable to move to another cell (`onCellChange`, bounded by `rowCount` and `columnCount`), and the cell's raw content on a single-line `CodeEditor` with the caller's `tokenize` and `completions`; Enter or the confirm button calls `onCommit`, Escape or the cancel button restores the content, and the caller's `evaluate` shows the result. Hooks: `ui-formula-bar` and its slots, `data-dirty`, `data-disabled`, `data-invalid`.
- `formatCellReference` and `parseCellReference` (new utilities) with the `CellCoordinates` type.
- Glyph `formula`; strings `redlineComparison`, `redlineSummary`, `redlineBlockType`, `redlineRow`, `redlineTypeChange`, `redlineFormatChange`, `redlineGoToNewPosition`, `redlineGoToOldPosition`, `redlinePreviousChange`, `redlineNextChange`, `redlineAccept`, `redlineReject`, `formulaBar`, `formulaCellReference`, `formulaCellContent`, `formulaInvalidReference` and `formulaResult`.
