---
'@flamboyantengineer/ui-components': patch
---

A native form reset restores a field's initial value using the field's own value equality (`isEqual` from `useFieldState`), so custom values such as sets or bigints reset like any other.
