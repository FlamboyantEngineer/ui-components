---
'@flamboyantengineer/ui-components': patch
---

`createConditionMatcher` and `matchesConditionGroup` now work in React Server Components with active rules. They import the filter bar's matching helpers from their pure modules instead of through the client `filter-bar.tsx`. Other server-safe modules now import pure helpers directly too, and `check:client-boundaries` reports a server module that calls a helper through a client re-export.
