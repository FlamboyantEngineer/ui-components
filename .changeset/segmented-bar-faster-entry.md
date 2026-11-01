---
'@flamboyantengineer/ui-components': patch
---

The reference sheet's `SegmentedBar` entry animation runs twice as fast: 0.6 seconds for the whole sequence instead of 1.2, with segment durations and delays halved alike for linear, donut and pie. The shared loop token is unchanged, so no other component speeds up.
