---
'@flamboyantengineer/ui-components': patch
---

The SegmentedChoice reference label keeps descenders and accents whole: it clips only sideways, with block padding taken back by a negative margin, so segment heights are unchanged (#1421).
