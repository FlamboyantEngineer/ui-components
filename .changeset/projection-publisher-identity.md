---
'@flamboyantengineer/ui-components': patch
---

`ProjectionOutlet` and `useProjectedContent` key projected content by its publishing `ProjectionContent`, so a publisher that takes over a slot, or an earlier one restored after it, no longer inherits the state of the content shown before it. The fallback is kept apart from content the same way.
