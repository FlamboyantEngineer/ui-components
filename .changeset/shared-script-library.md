---
'@flamboyantengineer/ui-components': minor
---

Export the helpers the scripts share as `./tooling/lib/<name>.mjs` (`script`, `npm`, `tar`, `unexported-types`, `imports` and `markdown-links`), so the libraries built on this one use them in their own scripts instead of copies.
