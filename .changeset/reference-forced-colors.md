---
'@flamboyantengineer/ui-components': patch
---

The reference stylesheet keeps keyboard focus visible in forced colours (Windows High Contrast): a focused component takes an outline in the system highlight colour, since the focus halos are box shadows the mode removes. Under `prefers-contrast: more`, borders take the strong border colour.
