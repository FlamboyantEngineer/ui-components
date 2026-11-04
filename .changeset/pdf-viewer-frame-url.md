---
'@flamboyantengineer/ui-components': patch
---

`PdfViewer` opens a `URL`, `ArrayBuffer` or `Uint8Array` made in another same-origin window, such as a frame or popup, and a new `URL` of any window for the same address keeps the open document.
