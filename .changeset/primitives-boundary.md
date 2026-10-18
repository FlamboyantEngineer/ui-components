---
'@flamboyantengineer/ui-components': patch
---

Route every React Aria import through one internal directory, `src/primitives/`, grouped by area. Lint rejects React Aria imports anywhere else. Components, props, hooks and behaviour are unchanged.
