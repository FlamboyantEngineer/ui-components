---
'@flamboyantengineer/ui-components': patch
---

A `Button` with `isDisabled` and `focusableWhenDisabled` refuses every activation, including the handlers a `MenuTrigger` or `PopoverTrigger` adds and its own press lifecycle callbacks, while keeping focus, hover and its tooltip, so a disabled action that explains itself can no longer open its menu. Its `render` callback now receives `isDisabled: true`.
