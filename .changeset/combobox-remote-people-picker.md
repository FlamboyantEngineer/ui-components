---
'@flamboyantengineer/ui-components': minor
---

Remote search for `Combobox`, and `PeoplePicker`.

- `Combobox`: `loadItems(query, signal, cursor?)` searches suggestions (options or sections, in lists or `{ items, cursor }` pages) while the list is open, at once on opening or for a new loader and after `searchDelay` (240 ms) when the text changes, from `minSearchLength` (1) characters, aborting replaced searches; `items` or `defaultItems` show while the text is too short. The empty list states loading, a failed search (`searchFailed`) or a short text (`typeToSearch`). `renderEmptyState` replaces `noResults`; `listHeader` draws controls above the options (`__list-header`), keeping the list open and focus in the input; `isOpen`, `defaultOpen` and `onOpenChange` control the open state; `inputRef` and `autoFocus`; chips draw their option's `icon` (`__chip-icon`). New types `ComboboxLoader` and `ComboboxPage`.
- `PeoplePicker` (new): choose one person or group, or several as chips with avatars, on `Combobox`; `loadItems`, `currentUser` (listed first and marked "(you)"), `recent` (a "Recent" section), groups told apart by `data-kind`, and people who cannot be picked with a `disabledReason`. Hooks: `ui-people-picker`, `__person`, `__you`, `__avatar`, `data-kind`. Types `PeoplePickerPerson`, `PeoplePickerLoader`, `PeoplePickerPage`.
- `SelectField`'s search now runs on the shared remote search helper; its behaviour is unchanged.
- Provider strings: `recentPeople` and `currentPerson`.
