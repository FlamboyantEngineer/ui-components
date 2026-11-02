---
'@flamboyantengineer/ui-components': patch
---

A required `Switch` is now a native constraint by default, as documented and as `Checkbox` is, so a native form submit stops while it is off; `validationBehavior="aria"` (or an `aria` form around it) keeps the ARIA-only report.
