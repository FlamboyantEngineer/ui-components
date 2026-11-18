---
'@flamboyantengineer/ui-components': minor
---

`SelectField` adds `mode="native"`: one choice drawn as the platform's own `<select>` and picker inside the field, with its label, validation, dirty state, restore, undo and menu. Options and labelled groups become `<option>` and `<optgroup>` elements, `name` submits through the select itself, so an enclosing disabled fieldset locks it and leaves it out of the form, and `isRequired` with the `native` validation behavior sets `required`. While no listed option has the value, a placeholder option shows and a required field reports the value missing; the choice is selected again once its option returns. `selectRef` receives the native select. New hooks: `ui-select-field__native`, and `data-mode="native"`.
