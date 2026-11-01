---
'@flamboyantengineer/ui-components': patch
---

A disclosure's panel scopes its content out of the disclosure: a `Disclosure` inside a grouped disclosure's panel keeps its own state instead of joining the group, and an `ExpandToggle` inside a panel (as in `Outline`, `Board` lanes or `TimelineChart`) owns its state. `PropertySection` and `PropertyCard` panels scope their content the same way.
