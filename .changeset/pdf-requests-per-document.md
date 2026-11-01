---
'@flamboyantengineer/ui-components': patch
---

`PdfViewer` opens each new document at the caller's current `revealRect` or `page`, even when it is unchanged from the previous document, without reporting the first page in between, and drops the previous document's pending request and page reports.
