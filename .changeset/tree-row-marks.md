---
'@flamboyantengineer/ui-components': minor
---

`Tree` takes `marks` to choose how the current row stands out (`tint`, `bold`, `underline`, `dot` or `caret`) and whether selected and new rows show a dot or a caret. `isItemNew` marks rows as new: they publish `data-new`, are described as "New" and draw a `ui-tree__new-mark`. Glyph marks are drawn in a `ui-tree__state-mark` slot that every row reserves, so marking a row never moves its label. `TreeItemState` gains `isNew`.
