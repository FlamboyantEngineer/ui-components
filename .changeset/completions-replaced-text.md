---
'@flamboyantengineer/ui-components': patch
---

Completions now belong to the text they were looked up for. In `TextField`, `MessageComposer` and `CodeEditor`, a value replaced from outside (a controlled reload, a reset, a recalled message) closes the open list and drops a pending answer, and inserting checks the text again, so an answer for earlier text can no longer overwrite the new value.
