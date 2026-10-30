---
'@flamboyantengineer/ui-components': minor
---

`InlineEdit` keeps edits made after a queued save. A queued `commit` no longer overwrites newer edits when it starts, and the editor stays open while it still holds unsaved edits. A custom editor's `commit` is now typed `(...value: [] | [T])`, so an explicit `null` or `undefined` is saved instead of being treated as "save the value being edited", at once or queued.
