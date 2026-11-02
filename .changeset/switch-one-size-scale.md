---
'@flamboyantengineer/ui-components': minor
---

BooleanField's switch is now the library `Switch`, so both share one size scale: the reference sheet sizes the track and thumb with `size` for a bare Switch too. `Switch` gains `isIndeterminate` (`data-indeterminate`), `isRequired`, `isInvalid` and `validationBehavior`. The `ui-boolean-field__track` and `ui-boolean-field__thumb` hooks are gone (use `ui-switch__track` and `ui-switch__thumb`), and the switch caption is `ui-switch__label`.
