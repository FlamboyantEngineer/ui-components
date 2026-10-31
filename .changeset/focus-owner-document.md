---
'@flamboyantengineer/ui-components': patch
---

FocusScope's `finalFocus` (and Modal's returning focus) now read focus from the container's own document, so a scope that a page's React renders into a same-origin frame restores focus inside the frame instead of silently skipping it, and it never pulls focus back into a frame once the page around it holds focus. Targets from a frame's window are recognized without `instanceof`, a Modal opened from a control inside a frame returns focus to that control, and the removable lists of File Upload and Chat Attachment List keep focus in a frame too.
