---
'@flamboyantengineer/ui-components': patch
---

`PermissionMatrix` identifies its role columns by role id rather than position, so reordering or inserting roles keeps the focused grant and group checkbox on the same role, and removing a role never moves its control onto another role.
