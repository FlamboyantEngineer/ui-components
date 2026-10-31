---
'@flamboyantengineer/ui-components': patch
---

A `Button` in a slot takes the disabled state of the component around it unless it sets `isDisabled` itself, so a trigger in a disabled `Disclosure` or `DisclosureGroup`, including `ExpandToggle`, is disabled, leaves the tab order and runs no callbacks. `slot={null}` still opts out.
