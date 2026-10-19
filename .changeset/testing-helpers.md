---
'@flamboyantengineer/ui-components': minor
---

Testing helpers at `@flamboyantengineer/ui-components/testing`, for hosts that test screens built from the library with any test runner.

- Widget drivers that take a Testing Library `user`: `selectOption` (`SelectField`, `Combobox`), `pickComboboxOption`, `openMenu`, `chooseMenuItem`, `pickDate`, `toggleTreeItem` and `dismissOverlay`; `getTableCell` finds a cell by row and column names.
- Queries: `getHookElement` finds a hook class element, `getFieldError` and `getFieldDescription` read what a field's control announces.
- `createMemoryStorage` is exported there too, for `UiProvider` in tests. Types `TestUser`, `NameMatch` and `ComboboxPick`.
- `@testing-library/dom` and `@testing-library/user-event` are new optional peer dependencies, needed only by the testing entry point.
