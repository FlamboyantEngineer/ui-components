---
'@flamboyantengineer/ui-components': patch
---

The reference stylesheet honours `prefers-reduced-motion: reduce` for every component: one base rule settles every animation and transition of a hook element at once, so buttons, menus, switches, sliders, cards and the other partials that animated regardless of the preference now hold still.
