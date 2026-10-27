---
'@flamboyantengineer/ui-components': minor
---

Forms report their verdict on what their fields show, for a Save action outside the submit. `useFormValidity()` returns a `FormValidity` (`isBlocked()`, `getBlockers()`, `subscribe()` and the deliberate `validate()`), and `Form` takes `onValidityChange`. Reading it reveals no validation, moves no focus and submits nothing. A date typed in part, a range with one end empty and typed text that is no colour now block the form even while the value is the last one accepted, through the new `FieldState.setDraftIssue`, with the provider strings `dateIncomplete` and `colorUnreadable`. A blocked submit now focuses the first segment of a date field.
