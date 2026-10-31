---
'@flamboyantengineer/ui-components': patch
---

A virtualized ChatTranscript forgets its measured heights when the conversation resets, so a new conversation's spacers average only its own messages. Tree and FolderManager forget the load state of a branch that leaves the items, so it asks again when it comes back. Outline forgets the reader's toggle of a heading that leaves the outline.
