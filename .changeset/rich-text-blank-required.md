---
'@flamboyantengineer/ui-components': patch
---

A required RichTextEditor now stays empty while its document holds only blank structure (empty paragraphs, lists, quotes, line breaks or whitespace), so pressing Enter no longer satisfies it. Dividers and caller atoms still count as content.
