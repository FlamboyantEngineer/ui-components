---
'@flamboyantengineer/ui-components': patch
---

`CodeBlock` measures its horizontal overflow after every render, when its content changes in the document (asynchronous highlighting, token classes and styles) and when fonts finish loading, so the code joins or leaves the tab order and `data-overflowing` follows when highlighting widens the same code.
