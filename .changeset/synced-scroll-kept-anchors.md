---
'@flamboyantengineer/ui-components': patch
---

`useSyncedScroll` keeps each container's anchors until a resize or mutation observer sees the container or its content change, so a scroll no longer re-measures every anchor row. `mapScrollOffset` pairs two anchor lists once.
