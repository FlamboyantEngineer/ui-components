---
'@flamboyantengineer/ui-components': patch
---

`ChatModelPicker`, `MessageComposerSelect` and `MessageComposerMenuButton` close an open menu when they or their composer become disabled, and the picker and select ignore choices from a menu still closing. A `ChatModelPicker` disabled on its own now stays focusable (`aria-disabled`), so focus returns to it as its menu closes.
