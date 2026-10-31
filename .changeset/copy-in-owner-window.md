---
'@flamboyantengineer/ui-components': minor
---

`copyText` and `copyRichText` take an `owner` node, and `useClipboard`'s `copy(text, owner)` passes it on: the copy uses that node's window clipboard and document, so `CopyButton`, the chat message Copy action and the PDF viewer's Copy work when rendered into a popup window or frame.
