---
'@flamboyantengineer/ui-components': patch
---

`PdfViewer` keeps one order for every navigation request: a destination still being looked up is dropped once the caller sets `page` or `revealRect`, find reveals a match, `destination` is cleared or another document opens, as it already was for newer destinations and page moves.
