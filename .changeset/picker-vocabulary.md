---
'@flamboyantengineer/ui-components': minor
---

`Combobox`, `SelectField` and `PeoplePicker` share one picker vocabulary. `PickerOption`, `PickerSection` and `PickerItem` are exported, and `ComboboxOption`/`ComboboxSection`/`ComboboxItem` and `SelectFieldOption`/`SelectFieldGroup`/`SelectFieldItem` name them. A combobox section is headed by `label` instead of `title`, and may leave it out. A select field page is `{ items, cursor }` instead of `{ options, cursor }`, the same page shape as the combobox and people picker loaders, and a select option's `description` may be any node (plain text is still matched by the filter). Option rows, the empty list's search status, the popover style and the virtualized list layout are drawn by one shared implementation.
