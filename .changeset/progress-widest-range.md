---
'@flamboyantengineer/ui-components': patch
---

Progress indicators and `LoadingCard` keep the true share of a range wider than the largest number (such as `-Number.MAX_VALUE` to `Number.MAX_VALUE`), so the fill, value text and card percentage agree instead of reading 0%.
