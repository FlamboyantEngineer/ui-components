---
'@flamboyantengineer/ui-components': patch
---

ScrollRegion follows content that changes deeper than the viewport's children (text, attributes, nodes, loaded images): `stickToBottom` stays pinned, and the edge distances, overlay thumbs and their ranges update, read once per animation frame.
