---
'@flamboyantengineer/ui-components': patch
---

`Carousel` reads the reduced-motion preference through a subscription: it hydrates without a mismatch and follows a preference changed while the page is open, until the reader uses the rotation button.
