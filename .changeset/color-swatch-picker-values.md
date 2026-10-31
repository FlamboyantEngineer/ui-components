---
'@flamboyantengineer/ui-components': minor
---

`ColorSwatchPicker` stays controlled when `value` is empty or unreadable and then picks nothing, and without `value` or `defaultValue` it starts with nothing picked instead of black. Items are separate options whatever their colour: equal colours in any spelling no longer crash the list, are picked together, and report their own `color` string.
