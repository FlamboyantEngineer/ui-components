---
'@flamboyantengineer/ui-components': patch
---

Every module imports each dependency in one sorted statement, and type-only imports compile away instead of leaving empty side-effect imports behind. Behaviour and the public API are unchanged.
