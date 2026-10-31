---
'@flamboyantengineer/ui-components': patch
---

`RedlineCompare` (through `compareBlocks`) pairs rewritten blocks without ids in near-linear work: a candidate whose length or shared words cannot reach the similarity threshold is skipped without a word diff, and each removed block runs at most eight word diffs while looking for its pair.
