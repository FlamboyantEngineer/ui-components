---
'@flamboyantengineer/ui-components': minor
---

`RichTextEditor` keeps one undo history, the editor's own. Its shortcuts, toolbar commands and the field's undo (field chords and `getFieldUndo`) all step through it. A document replaced from outside (a controlled change, restore, clear or set to default) is one undoable step, so undoing a restore brings the edits back. The field no longer keeps a second history of whole-document snapshots. Reported documents keep every block an edit leaves alone, and the field compares them by their shared parts instead of a serialized key. At 1,000,000 characters the median edit drops from about 20 ms to 0.2 ms, and the heap held by 20 edits drops from about 145 MiB to 3 MiB (`npm run bench:rich-text`).

`useFieldState` takes a second argument, a `FieldValueContract` (also accepted in `useFieldControl`'s options). A control uses it to give its own value comparison (`isEqual`) or to keep its own history (`hasOwnHistory`).
