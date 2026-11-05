---
'@flamboyantengineer/ui-components': patch
---

A component whose host starts controlling a value after uncontrolled use (such as `ExpandToggle` given `isExpanded` after a press) reports the next change against the controlled value, so a request equal to the value it last set on its own is no longer swallowed.
