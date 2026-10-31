---
'@flamboyantengineer/ui-components': patch
---

A `Button` with neither an icon nor children shows its `label` as visible text, so derived controls whose optional icon is absent, such as a custom `ActionRow` action without an `icon`, stay visible and named. A compact `MessageComposerToggle` or `MessageComposerSelect` without an icon to show keeps its label instead of becoming an empty button.
