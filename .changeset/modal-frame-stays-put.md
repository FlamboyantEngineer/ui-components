---
'@flamboyantengineer/ui-components': patch
---

The reference Modal stylesheet makes the modal body the containing block of what it positions, so the visually hidden inputs of checkboxes and switches in a tall body no longer give the overlay scroll room. Focusing a field or a restore button, expanding content or resizing the viewport now scrolls the body and keeps the frame, title, close button and footer in place, including on mobile WebKit. Host stylesheets that style `ui-modal__body` themselves should give it `position: relative`.
