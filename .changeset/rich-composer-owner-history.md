---
'@flamboyantengineer/ui-components': patch
---

`RichMessageComposer` starts a fresh undo history, selection and completion state when the draft's owner changes (its `persistKey`, the provider's storage or the message being edited), even when the new draft's text equals the one shown, so undo never brings back another draft's text.
