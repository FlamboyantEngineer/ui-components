---
'@flamboyantengineer/ui-components': patch
---

Focus requests after an edit (Board moves, Condition Builder, Step List Editor, tool-call approval and attachment lists) yield to a newer focus move: once the edited element has taken focus, a pending retry takes focus back only from its own collection settling, not from a control the application focused or a dialog that opened.
