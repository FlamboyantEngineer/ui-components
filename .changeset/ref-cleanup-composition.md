---
'@flamboyantengineer/ui-components': patch
---

`CodeEditor`'s surface and `ContextMenuTrigger` targets now merge the caller's `ref` with the shared `mergeRefs`, so a React 19 callback ref's cleanup runs once for each attachment, in Strict Mode too.
