---
'@flamboyantengineer/ui-components': minor
---

Timeline follows the reading direction: right to left, time runs from the right edge, the row list pins to the right, connectors mirror, and arrow keys and drags follow the axis. `ToastSwipeDirection` adds `start` and `end`, resolved through the locale's reading direction, and now defaults to `end`; `data-swipe-direction` publishes the resolved screen direction.
