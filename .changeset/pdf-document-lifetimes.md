---
'@flamboyantengineer/ui-components': patch
---

`PdfViewer` gives each source and retry its own document lifetime: returning to a document it left (A, B, then A again) loads it afresh instead of showing the destroyed document, and an ended lifetime's late result or password request changes nothing. Opening a document and extracting text for a search now keep at most 8 page requests in flight, measured on a 250-page document.
