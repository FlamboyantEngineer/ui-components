---
'@flamboyantengineer/ui-components': patch
---

`PropertyScope` with a custom `filter` now treats every nonblank query as active, including one such as `/`, `_` or `-` that holds no terms: the filter decides which rows, cards and containers show, and the no-match message appears when nothing passes.
