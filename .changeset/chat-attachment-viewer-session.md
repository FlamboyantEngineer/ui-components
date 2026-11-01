---
'@flamboyantengineer/ui-components': patch
---

ChatAttachmentList ends its media viewer once no image is listed, so a refilled list no longer reopens an abandoned viewer; a viewer whose image leaves shows the image now in its place, and focus in an ended viewer moves to the list or `finalFocus`.
