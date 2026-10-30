---
'@flamboyantengineer/ui-components': patch
---

Asynchronous field validation now scopes each result to its attempt: returning to a value checked before, or replacing `validateAsync`, keeps the field pending until a fresh check settles, and superseded or aborted checks change nothing. A new `validateAsync` function counts as a new validator, so keep it stable (defined outside render or memoized).
