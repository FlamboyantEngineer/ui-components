---
'@flamboyantengineer/ui-components': patch
---

`ScrollRegion` observes its viewport once: the overlay scrollbars, the edge distances and the overview share one resize observer, one mutation observer and one frame of reads, instead of up to three of each. Overlay geometry now also refreshes at once when the viewport resizes or a child comes or goes. `useScrollSpy` reads the sections' positions at most once per animation frame instead of on every scroll event.
