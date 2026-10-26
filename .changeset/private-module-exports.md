---
'@flamboyantengineer/ui-components': patch
---

Internal modules stop exporting the helpers, types and constants that only their own module uses. The package entry points export the same API as before.
