---
'@flamboyantengineer/ui-components': patch
---

`ToolbarRow`, `ToolbarScroller` and an `ActionRow` toolbar leave the arrow keys to a text control inside them: the caret moves, and focus moves to the next tool only from the end of the text. Modified arrows and composing keys stay with the control, and a PIN input moves between its own cells. `PdfViewer`'s toolbar now uses the same rule.
