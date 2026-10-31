---
'@flamboyantengineer/ui-components': patch
---

Completions in `TextField`, `MessageComposer` and `CodeEditor` now belong to the source that answered them: when `completions` change to another source while a lookup is pending or a list is open, the old answer is discarded before it shows or inserts and the new source is asked again. An inline vocabulary with equal completions keeps its list; keep a source function stable to avoid a new lookup on every render.
