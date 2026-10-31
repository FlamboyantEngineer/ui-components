---
'@flamboyantengineer/ui-components': patch
---

ToastRegion renders on the server under a `PortalHost` or a pending portal container instead of throwing, and renders into a same-origin frame's body or any other element as its container.
