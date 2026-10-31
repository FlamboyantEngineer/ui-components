---
'@flamboyantengineer/ui-components': patch
---

Checkbox, Switch, Combobox (and so PeoplePicker) and SearchField keep their value through a native form reset that a listener cancels, and apply a reset that goes through once every listener has seen it, as field controls do.
