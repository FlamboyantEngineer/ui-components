---
'@flamboyantengineer/ui-components': minor
---

Edits and overlays end with their subject: a Tree rename closes when `onRename` goes, message overlays close for good when their command goes, and FilterBar does not reopen an editor for a condition that took a removed one's place. Table and FolderManager set an owned search query aside while `filterable` is off, so a `defaultFilter.query` needs `filterable` to apply.
