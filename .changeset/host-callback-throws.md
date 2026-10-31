---
'@flamboyantengineer/ui-components': patch
---

An emoji loader or a completion source that throws before it answers now fails as one that rejects: the emoji picker shows its load failure, and a lookup shows nothing, instead of the error escaping into the host's error boundary.
