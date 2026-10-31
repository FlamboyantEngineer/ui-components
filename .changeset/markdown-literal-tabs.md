---
'@flamboyantengineer/ui-components': patch
---

Markdown keeps the tabs of code blocks as written, so a Makefile recipe copies and applies with its tab. Tabs still span the columns to the next multiple of four where block structure is read, now also inside block quotes and list items, and a tab that indentation removes only in part leaves spaces. Blank lines inside indented code keep their whitespace beyond the four removed columns, and a lazy line now continues a paragraph indented into a nested list item.
