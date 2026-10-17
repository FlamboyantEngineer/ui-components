---
'@flamboyantengineer/ui-components': minor
---

Add `Form` (React Aria form that validates its fields on submit, blocks the submit while a field has an error or is being checked, focuses the first such field and shows `validationErrors` by field name), `Fieldset` (legend and shared disabled state), `CheckboxGroup` (a field for a list of values with an optional select-all parent box) and a standalone `Switch`.

The field base gains, additively: `validationMode` (`immediate`, `change`, `blur`, `submit`), `validateAsync` with `validationDebounce`, `validationBehavior` (`native` gives the control the field's error as custom validity), `name` for external errors, `validate` returning several issues, `FieldIssue.validity`, `renderMessage`, `state.realtimeValidation`, `state.issues`, `state.isTouched`, `state.touch()`, `state.revealValidation()`, the `data-touched`, `data-filled` and `data-focused` root states, and `getLength` in the string rules.

`TextField` gains `startAdornment`, `endAdornment`, `allowsReveal` for passwords, `minRows` and `maxRows` for a growing text area and `showCount`. `NumberField` gains `startAdornment`, `endAdornment`, `smallStep`, `largeStep` and `showScrubber`. `SearchField` gains `labelLayout`, `description`, `errorMessage` and `isPending`. New glyphs `eye`, `eye-slash` and `scrub`; new strings `revealValue` and `characterCount`.
