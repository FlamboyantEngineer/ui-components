---
'@flamboyantengineer/ui-components': patch
---

`DropdownMenu` keeps an uncontrolled selection (`defaultSelectedKeys`) when its menu closes and opens again, instead of going back to the defaults each time it opens.
