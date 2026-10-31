---
'@flamboyantengineer/ui-components': minor
---

Choice values now follow the choices on screen. A `ChoiceGroup` key whose choice is removed stays in the value but no longer fills a required group or submits, and a selected disabled choice submits through a hidden input. A chosen `''` id in `SelectField` (list and tree) and `ChoiceGroup` fills a required field. Field controls can say what an empty value is through the new `isEmpty` option of `useFieldControl`, and `FieldState` exposes `isEmpty`.
