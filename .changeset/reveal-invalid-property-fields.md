---
'@flamboyantengineer/ui-components': minor
---

Fields reveal themselves before a form focuses them. A blocked submit, `FormValidity.validate()`, a blocker's or a problem's `focus()`, and a blocked native submit now open the collapsed `PropertySection`s and `PropertyCard`s around the field and lift a `PropertyScope` query that hides its row, calling `onClear`, before moving focus.
