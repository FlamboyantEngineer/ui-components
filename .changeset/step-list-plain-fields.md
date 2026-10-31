---
'@flamboyantengineer/ui-components': patch
---

`StepListEditor` embeds the fields of a step with no committed counterpart as plain inputs (`tracksChanges: false`) instead of mirroring their value into `committedValue`.
