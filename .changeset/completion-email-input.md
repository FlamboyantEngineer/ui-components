---
'@flamboyantengineer/ui-components': patch
---

Choosing a completion in a `TextField` whose input has no caret, such as `type="email"`, no longer throws: the completion replaces the whole value as one browser edit, kept on the undo stack, or through the field's value where the browser offers no such edit.
