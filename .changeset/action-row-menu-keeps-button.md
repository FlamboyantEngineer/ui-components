---
'@flamboyantengineer/ui-components': minor
---

ActionRow actions keep their button element, ref and focus as menu items arrive and leave. `MenuTrigger` takes `isDisabled`, which keeps the trigger but hands it no menu. A press on a disabled `Button` no longer swallows the first press once it is enabled.
