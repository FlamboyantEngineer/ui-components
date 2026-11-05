---
'@flamboyantengineer/ui-components': patch
---

`diffLines`, `diffWords` and `diffSequences` replace sequences with nothing in common in linear time instead of searching quadratically for a path, so rewriting a long text no longer blocks for seconds. The hunks are unchanged.
