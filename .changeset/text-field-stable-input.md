---
'@flamboyantengineer/ui-components': minor
---

TextField always renders its `ui-text-field__group` around the input and marks it `data-framed` while it holds adornments or a reveal button, so adding or removing one keeps the same input, its selection, composition and ref. Hosts that styled `.ui-text-field__group` as the frame should scope those rules to `[data-framed]` and give the unframed group `display: contents`, as the reference sheet does.
