---
'@flamboyantengineer/ui-components': patch
---

A toast's `onClose` runs after the queue has removed the toast, so a callback that adds, replaces, closes or clears toasts no longer removes the wrong toast or leaves the closed one behind; an error it throws is reported without stopping the queue.
