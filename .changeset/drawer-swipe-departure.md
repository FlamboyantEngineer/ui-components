---
'@flamboyantengineer/ui-components': patch
---

`Drawer` closes once a swipe has taken its panel out of the viewport, even when React Aria's sheet misses it: on a page of fractional height scrolled to its end, when the panel still touches the viewport's edge once out (one that fills the viewport along its swipe axis, or one swiped away from the edge it rests on), or when a scroll cuts its slide out short. Before, the swipe could leave the drawer open, and Escape or the close button could leave it mounted and blocking the page. `data-expanded` now appears on such a page once the panel has fully entered.
