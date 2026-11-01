---
'@flamboyantengineer/ui-components': minor
---

A `Chat` edit or reply that the host accepts later now ends only its own session, and only while the composer still shows the message that was sent: words added while the save waited, or an edit started again meanwhile, are no longer discarded. `MessageComposerHandle` gains `getValue()`, which reads what the text box shows now, the message being edited or else the draft.
