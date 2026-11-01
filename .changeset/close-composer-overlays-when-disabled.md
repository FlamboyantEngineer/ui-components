---
'@flamboyantengineer/ui-components': patch
---

`EmojiPickerTrigger` takes `isDisabled`, which opens nothing and closes an open picker for good; the composer's emoji button passes its disabled state, and both composers refuse inserted text and pills while disabled. A UserCardTrigger that turns disabled closes its open card in both modes, and a disabled Chat drops Remove and Retry from the next message's attachments.
