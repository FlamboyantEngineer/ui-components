---
'@flamboyantengineer/ui-components': minor
---

Fix collection, feedback and editing components found in review.

- `Modal`: function children also receive `runPrimaryAction`, which runs the primary action as a press does (once at a time, pending, failure shown), for a field that saves on Enter.
- `ViewSwitcher`: Enter in the name dialog runs its Save action, so one key press saves once, Save shows pending and a failure is shown; Control+Enter no longer saves twice. When the selected view leaves `views`, the default view (else the first) shows as selected and an uncontrolled selection reports the move. The menu variant is named by `aria-labelledby`.
- `VersionHistory`: Enter in the name dialog runs its Save action, as in `ViewSwitcher`. The person filter matches names that carry surrounding spaces.
- `DropdownMenu`: `aria-labelledby` names the menu.
- `PeoplePicker`: `knownPeople` lists people before a search and names the chosen ones of a saved value in the input and chips without a search.
- `FilterBar` and `ConditionBuilder`: a person value shows the chosen people's names instead of their ids.
- `NotificationList`: when the row holding focus leaves (a dismissal, a read toggle under the unread filter, a caller action), focus moves to the next row's same control, else the previous row's, else the filter.
- `FindBar`: the Enter that confirms a text composition neither steps nor replaces.
- `FolderManager`: in multiple selection, `onSelectionChange` receives a `Set` of keys, as React Aria's collections report it; its type follows `selectionMode`. `onSelectedKeysChange` still works and is deprecated. Filtering reveals matches under a collapsed root row, and a filter without matches shows the no-results message. Move to lists its places only when the menu opens, and numeric and text ids no longer collide there. The `data-disabled` row is removed from the hooks table: the name field never emitted it.
- `CommentComposer`: `persistKey` names the storage key of an uncontrolled draft; `storageKey` still works and is deprecated. A disabled composer offers no Cancel and keeps its draft.
- `ProblemList`: the severity, label and message read as separate words without a stylesheet, and the jump button holds phrasing content only.
- `ApprovalPanel`: the reader's mark reads as a separate word, and a panel without approvers is `pending`.
- `StateTimeline`: numeric and text ids such as `1` and `'1'` identify distinct entries, and the current and upcoming marks read as separate words.
