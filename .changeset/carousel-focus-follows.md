---
'@flamboyantengineer/ui-components': patch
---

`Carousel` keeps focus inside when the focused slide stops being shown for any reason: a controlled `index` change, the slide's removal, or a move inside a shadow root. A move the host refused no longer pulls focus back later once it has left the carousel.
