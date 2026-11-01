---
'@flamboyantengineer/ui-components': patch
---

InlineEdit's opening focus goes to the editor's first part that Tab reaches: it skips hidden inputs and parts that are disabled (also by a fieldset), hidden or inert, and moves on when a part does not take focus.
