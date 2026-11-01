---
'@flamboyantengineer/ui-components': patch
---

The Enter that confirms an input method candidate (key code 229) no longer submits `QueryField`, saves or renames a view in `ViewSwitcher`, names a version in `VersionHistory`, runs a `CommandPalette` command, or answers a `prompt`. Chat question fields, tool-call approval keys and a modal's Escape use the same shared check.
