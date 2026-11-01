---
'@flamboyantengineer/ui-components': patch
---

SearchField, EmojiPicker's search and CharacterGrid's search leave an Enter that belongs to an input method composition, including the key code 229 Enter that confirms a candidate, to the input method: it submits, chooses and records nothing. The shared `leaveComposingEnter` capture handler stops it at the input.
