---
'@flamboyantengineer/ui-components': patch
---

`ToastRegion` now sits on the shared `toast` overlay layer: it carries the layer's z-index (160 unless `layerZIndex` on a `PortalContainerProvider` or `PortalHost` replaces it) and portals into the same container as a `Portal` below that provider or host. Toasts stack above drawers and dialogs, and their action and dismiss buttons take presses where they overlap one. The reference stylesheet drops its own z-index for `.ui-toast-region`.
