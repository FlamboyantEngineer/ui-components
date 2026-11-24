---
'@flamboyantengineer/ui-components': patch
---

Code and rich text editors share scrollbar and marker measurement. Code editors reuse the gutter's line count, both editors skip marker observers when there are no marks, and rich text editors reuse cached block positions when placing markers.
