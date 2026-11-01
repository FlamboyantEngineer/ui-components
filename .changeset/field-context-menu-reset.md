---
'@flamboyantengineer/ui-components': minor
---

Every field's menu is now its context menu, and the three-dot menu button is gone: a secondary click or long touch on the field, or Shift+F10 or the Context Menu key in it, opens it (the text of an input keeps the browser's own menu on a secondary click). Without `menu`, a field offers `defaultFieldMenu`: Clear, left out when the field can never be cleared, and the new Reset entry (`'reset'`, provider string `resetValue`), which puts back the last committed value. Opening the menu keeps a field's draft instead of committing it, a built-in action returns focus to the control, and `FieldState` gains `isClearable`. The `ui-field__menu` hook is removed.
