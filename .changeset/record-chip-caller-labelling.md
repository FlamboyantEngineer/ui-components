---
'@flamboyantengineer/ui-components': patch
---

A `RecordLabel` chip passes `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-details` to its label's link (or hidden text), not its generic root, and keeps the caller's and the stacked name's descriptions when a preview adds its own. A `Link` keeps its own description first under a hover card trigger.
