---
'@flamboyantengineer/ui-components': minor
---

SearchField checks its query in the field vocabulary: `validate` returns `FieldIssues` (errors make it invalid, warnings advise), `validationBehavior` defaults to `aria` like fields, and the message shows in the field's live message region (`ui-search-field__message` with `data-severity`; the root publishes `data-validation`). `isInvalid`, `errorMessage`, the `SearchFieldValidate` type and the `ui-search-field__error` slot are removed.
