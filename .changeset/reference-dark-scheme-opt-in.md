---
'@flamboyantengineer/ui-components': patch
---

The reference stylesheet sets the dark `color-scheme` only on a document that opts into its document base with `data-reference-document`, so a host page using `data-theme="dark"` keeps its own colour scheme while the dark tokens still style the components.
