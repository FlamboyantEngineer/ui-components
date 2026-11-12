---
'@flamboyantengineer/ui-components': patch
---

`ChatTranscript` keeps the reader's place exactly while a batch of messages arrives below a virtualized history: spacers are drawn in whole pixels, which the scroll position can follow, and the place is kept against where the reader left it, so shifts too small to correct one at a time no longer add up.
