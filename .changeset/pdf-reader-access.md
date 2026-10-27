---
'@flamboyantengineer/ui-components': minor
---

`PdfViewer` lets the caller follow the reader. `onDocumentChange` hands a handle on each open document (`pageCount` and `getPageText`, which reads any page's text, engine text content and 100% viewport without drawing it) and `null` when it closes. `onPageClick` reports primary clicks on a page in page coordinates, leaving links, controls and caller-handled clicks alone. `onSelectionChange` reports each finished text selection and its end. `onVisiblePositionChange` reports the page and offset at the top of the view. New types: `PdfDocumentAccess`, `PdfPageContent` and `PdfVisiblePosition`.
