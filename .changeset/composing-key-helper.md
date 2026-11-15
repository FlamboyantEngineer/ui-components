---
'@flamboyantengineer/ui-components': minor
---

Adds `isComposingKey(event)` and its `CompositionKey` type to the root entry: whether a key event belongs to an input method composition (pressed while composing, or the key code 229 Enter that confirms a candidate), so a host's own Enter and Escape handlers leave such keys to the input method as the library's controls do.
