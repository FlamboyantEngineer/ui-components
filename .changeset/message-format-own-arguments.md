---
'@flamboyantengineer/ui-components': patch
---

`formatMessage` reads only the own entries of `values`: a message naming `{toString}`, `{constructor}` or `{__proto__}` throws when the value is left out, and an own `__proto__` value interpolates instead of printing `[object Object]`.
