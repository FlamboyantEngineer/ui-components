---
'@flamboyantengineer/ui-components': minor
---

`VersionHistory` folds versions: a version's `children` are older versions folded under it, such as the automatic versions before a named one, shown and hidden by a toggle on its row (the new `foldedVersions` string) and tracked with `expandedKeys`, `defaultExpandedKeys` and `onExpandedChange`. Folded versions select, compare, filter and take actions like any other; rows publish `data-nested` and `data-expanded`.
