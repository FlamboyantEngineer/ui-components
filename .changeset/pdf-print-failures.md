---
'@flamboyantengineer/ui-components': minor
---

`PdfViewer` releases a print's hidden frame and every page image drawn so far when a page fails to draw or encode, cancels a pending print when another print starts, another document opens or the viewer unmounts, and reports failed prints and saves through the new `onCommandError(command, error)` prop.
