---
'@flamboyantengineer/ui-components': patch
---

RelativeDateField refuses a range whose end precedes its start, as DateTimeField does: the value is invalid, blocks a Form submit, and a preset with a reversed range is disabled.
