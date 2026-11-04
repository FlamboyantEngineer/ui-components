---
'@flamboyantengineer/ui-components': patch
---

A growing text area (`MessageComposer`, multiline `TextField`) keeps the box around it at its height while it measures its text, so a transcript beside the composer no longer gives up following on a keystroke that leaves the composer's height unchanged.
