---
'@flamboyantengineer/ui-components': minor
---

Fix the choice field findings from the second library review.

- Cascader Field: opening on a saved path loads its unloaded branch, with focus waiting on that branch. New `isOpen`, `defaultOpen` and `onOpenChange`. Each branch is described as opening more options (new provider string `cascaderOpensLevel`). A loader that throws at once shows the failure.
- Inline Edit: pressing Cancel never saves, also where a press takes no focus, and focus moves only as editing turns on or off.
- Inline Text Field: a commit the host stores changed, such as trimmed, shows the stored value.
- Boolean Field: an unset switch is described by its caption. The `name` doc now matches every variant.
- Masked Text Field: a raw value whose characters a literal also spells reads as raw. The raw form value follows a disabled scope.
- Time Zone Field: a change of the chosen zone no longer describes every listed zone again.
- Snippet Field: an equal value passed inline keeps the reader's draft, and a loader that throws at once reports its error.
- Completion triggers: a query with spaces holds at most `maxWords` words (three by default).
- Transfer List: move up and down step among the rows the filter shows.
- Choice: a multiple-mode choice keeps the caller's `data-*` attributes on its root.
- Pin Input: cells turn off spell checking, capitalisation and correction.
- People Picker: takes `name`, `form`, `autoFocus`, `inputRef`, `minSearchLength` and the open-state props.
