---
'@flamboyantengineer/ui-components': patch
---

`ChatParts` keeps a failed tool call discoverable inside its group of steps.

- A group holding a failed call stays open once the run ends and the answer follows, while a group of successful steps still collapses.
- When a call newly fails, including in the update that ends the run, the group and the card the reader had closed open again, as if the reader had opened them; `onExpandedPartsChange` receives them, so `Chat` and other hosts that keep `expandedParts` see the change. Closing them again holds until another call newly fails.
- A call that had already failed when the parts mount, as in loaded history or a remount under virtualization, leaves a kept closed choice alone.
