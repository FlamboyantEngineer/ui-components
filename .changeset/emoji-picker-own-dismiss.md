---
'@flamboyantengineer/ui-components': patch
---

`EmojiPicker` closes only the popover of its own `EmojiPickerTrigger` when the reader chooses an emoji. A picker anywhere else, such as in a `Modal` or `Drawer` body or in the chat reaction popover, no longer closes the overlay around it.
