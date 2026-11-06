---
'@flamboyantengineer/ui-components': patch
---

The rich `MessageComposer` lets go of a pending asynchronous paste however its answer settles, including when the reader edited the pasted text first, so a long-lived draft no longer keeps the pasted text and maps it through every later edit.
