---
'@flamboyantengineer/ui-components': minor
---

DateTimeField and RelativeDateField flag a value their mode cannot read (such as `2026-02-30`, `25:00`, or a range with an unreadable end) as invalid with the new provider string `dateUnreadable`, blocking a Form submit. RelativeDateField also disables and never commits a preset whose value its mode cannot read.
