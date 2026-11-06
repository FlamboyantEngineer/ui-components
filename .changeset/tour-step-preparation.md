---
'@flamboyantengineer/ui-components': minor
---

`Tour` steps take `prepare({ signal })` to get their target ready first, such as by opening a collapsed section or loading data, and `targetTimeout` to wait for a target that arrives later. A step shows as pending (`data-status`, an announced status) until ready, or failed with Retry. Moving on, skipping, closing, a step of another `id` and unmounting abort the preparation.
