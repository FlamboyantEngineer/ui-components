---
'@flamboyantengineer/ui-components': patch
---

Links whose `target` names a window, or is `_blank` in another letter case, now get `noopener noreferrer` and say they open in a new tab, in `Link`, link buttons, list rows, card actions and `HtmlMarkup` output. `PdfViewer` ignores outline entries and document links whose address is unsafe, and `CommentText` writes a mention inside a Markdown link's address or title as its token instead of a private marker.
