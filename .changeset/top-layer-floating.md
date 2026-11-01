---
'@flamboyantengineer/ui-components': patch
---

A non-modal `Modal` and a full-screen `LoadingOverlay` opened while a blocking modal is open now stay reachable, visible to assistive technology and announced: both render through a top-layer portal, and the floating dialog's panel joins React Aria's focus scopes.
