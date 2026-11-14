---
'@flamboyantengineer/ui-components': minor
---

A typeable `ColorField` makes a typed color the value as it is typed, so a form submitted while the input has focus sends the color on screen. Escape, or leaving text that is no color, puts back the value the typing started from. A value replaced from outside retires the typed text. A non-empty value that is no color is now invalid with the `colorUnreadable` message instead of passing as filled.
