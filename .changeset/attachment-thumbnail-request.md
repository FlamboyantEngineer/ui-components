---
'@flamboyantengineer/ui-components': patch
---

A `ChatAttachment` thumbnail falls back to the file chip only for the address that failed, so a replaced address's late error no longer hides the new thumbnail, and an image that failed before hydration now falls back too.
