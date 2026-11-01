---
'@flamboyantengineer/ui-components': patch
---

In Table spreadsheet mode, controls, editable content and focusable elements inside a cell (switches, radios, sliders, tabs, options, labels, `summary`, any `contenteditable` other than `false`) and presses a handler already prevented keep their presses instead of selecting the cell. Table, DiagramCanvas and PdfViewer now share one test for interactive content.
