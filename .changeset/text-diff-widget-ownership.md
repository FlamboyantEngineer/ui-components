---
'@flamboyantengineer/ui-components': minor
---

TextDiff line widgets belong to one pair of texts: when either text changes, every widget is a new element, so a draft or editor history never carries over to a line of the new texts. `TextDiffLine` gains `id`, which names the line within its pair of texts in both layouts and through folds, so a host can keep widget state across layout changes.
