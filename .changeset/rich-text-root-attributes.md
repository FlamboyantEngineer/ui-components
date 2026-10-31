---
'@flamboyantengineer/ui-components': patch
---

RichTextEditor now replaces a caller schema's document attributes along with its content when the value changes from outside, so the next edit no longer writes the old attributes back.
