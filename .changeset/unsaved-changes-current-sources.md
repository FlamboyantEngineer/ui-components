---
'@flamboyantengineer/ui-components': patch
---

`UnsavedChangesGuard` follows the dirty sources while its question is open, and Save and Discard read the registrations afresh after every awaited action: a removed source is skipped, a replaced action runs in place of the old one, a newly dirty source takes its turn, and Save stops, without leaving, at a dirty source that can no longer save.
