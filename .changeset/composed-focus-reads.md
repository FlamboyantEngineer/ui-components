---
'@flamboyantengineer/ui-components': patch
---

Components read focus through shadow roots everywhere: closing editors, renames, moved panes, settled questions, removed rows, focus requests, InlineEdit's first control and native edits that keep the undo stack now work inside web components. `getDeepActiveElement` follows open shadow roots as well as frames.
