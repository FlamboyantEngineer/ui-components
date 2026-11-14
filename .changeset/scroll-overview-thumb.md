---
'@flamboyantengineer/ui-components': minor
---

`ScrollOverview` is a custom vertical scrollbar: over its marker track it draws a `ui-scroll-overview__thumb` that follows the container's scroll position and scrolls the container when dragged, and a press on the track pages toward it (or, with `onMarkerActivate`, jumps to the marker pressed). The root publishes `data-scrollable` while the content overflows and always takes pointer input. Hosts hide the container's native scrollbar, for example with `scrollbar-width: none`.
