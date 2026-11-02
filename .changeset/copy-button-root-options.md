---
'@flamboyantengineer/ui-components': minor
---

CopyButton's root now publishes its resolved `data-variant`, `data-size` and `data-disabled`, as the Button inside it does, so a stylesheet styles the whole control from its root. Explicit defaults (`ghost`, `md`) win over caller attributes of the same name.
