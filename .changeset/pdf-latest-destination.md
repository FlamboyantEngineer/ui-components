---
'@flamboyantengineer/ui-components': patch
---

PdfViewer: only the latest navigation counts. A destination still being looked up (from `destination`, an outline entry or a link) no longer moves the reader once another destination is followed or the reader goes to a page.
