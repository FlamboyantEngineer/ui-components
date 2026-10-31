---
'@flamboyantengineer/ui-components': patch
---

The rich composer now shares the rich-text editor's engine glue instead of keeping its own copies: the placeholder decoration, a parameterised `useSyncedEditorState`, and a stable `editable` callback. The rich composer and the growing text area read their line box through one `readLineBox` helper.
