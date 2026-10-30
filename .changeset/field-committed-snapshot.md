---
'@flamboyantengineer/ui-components': patch
---

Fields read their value, callbacks, validators and lock from the last committed render, so a transition that suspends while switching a field to new options no longer sends the visible field's edits, commits or asynchronous checks to the options that have not rendered yet.
