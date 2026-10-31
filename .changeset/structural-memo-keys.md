---
'@flamboyantengineer/ui-components': patch
---

Chat text parts, Chat's edit value, `Markdown`'s heading ids and the composer's message comparison no longer serialise to JSON on every render to keep values stable. They compare items field by field through a shared `useStableArray`, so a rebuilt array keeps its identity without new objects.
