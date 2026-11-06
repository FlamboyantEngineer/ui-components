---
'@flamboyantengineer/ui-components': minor
---

`Combobox` (and `PeoplePicker`) callbacks pass a second `{ reason }` argument: `onChange` tells a pick from a chip removal, the clear button and a form reset; `onInputChange` tells typed text from the label the combobox writes (`sync`), so a remote search runs only for typing and clearing; `onOpenChange` names what opened the list and whether it closed for a pick, a dismissal or a lock. The callback order for picking, clearing, removing, Escape, leaving the field and adding an option is specified.
