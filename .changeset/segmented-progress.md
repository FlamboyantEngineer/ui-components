---
'@flamboyantengineer/ui-components': minor
---

`ProgressBar` takes `segments`, an ordered list of work units (`id`, `label` and a `complete`, `current` or `pending` state), and draws one equal segment per unit in its track. The bar stays one progress indicator whose value counts completed units: one completed unit of seven reads `1/7 · 14%` with the second segment current, and its spoken value names the unit under way (`1 of 7 done, 14%, Draft in progress`). Segments publish `data-state` in the new `ui-progress-bar__segment` slot and the root publishes `data-segmented`; the reference sheet stripes the current unit and narrows the gaps for long sequences. The provider strings `segmentCount` and `segmentProgress` word the value text.
