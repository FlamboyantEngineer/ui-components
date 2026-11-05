---
'@flamboyantengineer/ui-components': patch
---

After Select All in the rich `MessageComposer`, `getSelection()`, `replaceSelection()` and the range handed to `onPaste` cover the whole message text instead of an empty range at its end, so a replacement takes the place of the draft rather than being appended.
