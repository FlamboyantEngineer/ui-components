---
'@flamboyantengineer/ui-components': patch
---

Effects no longer set state that can be derived during render. Disabling a decision, locking completions, closing a modal, leaving diagram edit mode, losing an outline heading or tree branch, and revoking a table cell's editability now update in the same render, and image thumbnails create their URL during render (keeping it through a Strict Mode remount). Effects that must read the committed DOM say why and run as layout effects.
