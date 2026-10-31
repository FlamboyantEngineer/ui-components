---
'@flamboyantengineer/ui-components': patch
---

Tour, `useScrollSpy` (and so Outline), `useElementSize` (and so the auto-growing TextField) and `useInView` now follow a stable ref to an element that mounts late or replaces the previous one. A tour step whose target is replaced keeps its spotlight and dialog on the new element, and one whose target is removed falls back to the centred `data-target-missing` state.
