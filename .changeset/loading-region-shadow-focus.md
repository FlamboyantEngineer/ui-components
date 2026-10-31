---
'@flamboyantengineer/ui-components': patch
---

`LoadingRegion` keeps and returns keyboard focus inside shadow roots: a region in a shadow root, in nested shadow roots, or holding an element inside a shadow host now parks focus while blocked and gives it back to that element afterwards.
