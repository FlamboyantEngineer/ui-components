---
'@flamboyantengineer/ui-components': patch
---

RichTextEditor's SelectionToolbar now stays over its selection when the layout moves it without an edit: scrolling, a window resize, the editor rewrapping or moving. It hides while the selection is scrolled out of view.
