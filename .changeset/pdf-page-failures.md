---
'@flamboyantengineer/ui-components': minor
---

`PdfViewer` shows a page whose bitmap fails to draw with an inline error and a retry (`data-error` on the page, a new `ui-pdf-viewer__page-error` slot and `pageFailed` string), keeps the other pages readable, and reports the failure through the new `onPageError(pageIndex, error)` prop. A cancelled drawing is not a failure.
