---
'@flamboyantengineer/ui-components': patch
---

Fields leave input method compositions alone. TextField Enter and Escape, NumberField Enter and the Shift or Alt arrow steps, TagsInput Enter and field undo chords now ignore keys with key code 229 as well as `isComposing`. TagsInput keeps composed text whole until the composition ends, then splits it at delimiters once. PinInput keeps composed text in its cell, without advancing or completing, until the composition ends.
