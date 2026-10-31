---
'@flamboyantengineer/ui-components': patch
---

RichTextEditor and the rich message composer now type, paste and handle keys at the browser's latest caret, even when the caret moved while the editor was rendering. Before, text could land at the old caret.
