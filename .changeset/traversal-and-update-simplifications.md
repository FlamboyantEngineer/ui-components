---
'@flamboyantengineer/ui-components': minor
---

Simplify document diffs, hierarchy traversal, folder movement checks, chart and calendar calculations, PDF highlighting, character filtering, shared delayed states, and viewport observation. Handle large merge chunks, markup documents, PDF matches, and dropped folders without exceeding JavaScript's argument limit. Preserve tiny numeric steps and overflowing amount proportions, stop locked drags through the shared pointer lifecycle, and ignore stale observer and focus callbacks.

Breaking before 1.0: document comparison row keys now encode the primitive type of block IDs so numeric and string IDs with the same spelling remain distinct. Treat row keys as opaque values and use the returned counterpart keys for moved rows.
