---
'@flamboyantengineer/ui-components': patch
---

Hook data attributes cost less on every render: their names are worked out once per key, and a root writes its values in one pass.
