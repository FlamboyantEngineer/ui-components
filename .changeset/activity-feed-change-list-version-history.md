---
'@flamboyantengineer/ui-components': minor
---

Add `ActivityFeed`, `ChangeList` and `VersionHistory`.

- `ActivityFeed`: a chronological feed of events (`items`: person, action, target, time, detail, icon) grouped under a heading per day (`groupBy`: `day` or `none`, `headingLevel`), with a `filter` slot, loading of older events as the end comes into view (`onLoadMore`, `isLoading`, `aria-busy`), `renderEmptyState`, `fallbackAfterDays` and `getNow`. Hooks: `ui-activity-feed` and its slots, `data-group-by`, `data-loading`.
- `ChangeList`: what changed in a record, one description-list row per property (`changes`: label, `type` `text`, `value` or `list`, before, after, person, time), in a `compact` or `detailed` `variant`, with a word diff of text, the items added to and removed from lists, `renderValue` and `renderEmptyState`. Hooks: `ui-change-list` and its slots, `data-variant`, `data-type`, `data-change`, `data-side`.
- `VersionHistory`: saved versions newest first (named or automatic, `currentKey`), selecting one to view and two to compare (`selectedKeys`, `onSelectionChange`, `onCompare` with the older first), restoring after a confirmation (`onRestore`), naming and renaming (`onRename`), filters for named versions and by person (`filter`, `defaultFilter`, `onFilterChange`, `showFilters`), loading more, errors with retry and an empty state. Hooks: `ui-version-history` and its slots, `data-named`, `data-current`, `data-loading`.
- New provider strings (in a new history strings module): `activity`, `noActivity`, `noChanges`, `changedTo`, `valueBefore`, `valueAfter`, `emptyValue`, `versionHistory`, `currentVersion`, `compareVersions`, `namedVersionsOnly`, `versionsBy`, `anyone`, `versionActions`, `restoreVersion`, `restoreVersionTitle`, `restoreVersionMessage`, `restore`, `nameVersion`, `renameVersion`, `versionName`, `noVersions`, `noMatchingVersions`.
