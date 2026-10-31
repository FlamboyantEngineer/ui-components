---
'@flamboyantengineer/ui-components': patch
---

`Button` treats an `icon` of `null` or `false` like `undefined`: the button stays a labelled button with its children, its `secondary` default and `data-content="label"`, in button and link modes, so a conditional icon such as `icon={isDone && CheckGlyph}` no longer throws or selects icon-only mode. `SegmentedChoice` icon-only segments do the same.
