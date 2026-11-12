---
'@flamboyantengineer/ui-components': patch
---

`ChatTranscript` keeps the reader's place against where they left it, so several sub-pixel shifts above the view, such as spacer estimates updating as a batch of messages is measured, no longer add up to a visible drift.
