---
'@flamboyantengineer/ui-components': patch
---

A `Spinner` given `label` no longer logs an "Unexpected DOM element" warning in development builds. It keeps its inline `<span>`, its name and its indeterminate progress bar semantics.
