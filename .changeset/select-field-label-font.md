---
'@flamboyantengineer/ui-components': patch
---

`SelectField` measures its label width in the value label's font and measures again when the choice changes, so a choice a stylesheet draws bold or larger is not cut short. `useWidestTextWidth` takes a `fontKey` that measures again when it changes.
