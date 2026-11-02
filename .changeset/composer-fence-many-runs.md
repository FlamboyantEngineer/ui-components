---
'@flamboyantengineer/ui-components': patch
---

The rich composer no longer throws when a code block holds very many runs of backticks: it finds the longest run one at a time instead of passing them all to `Math.max`.
