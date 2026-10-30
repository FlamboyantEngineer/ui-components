---
'@flamboyantengineer/ui-components': patch
---

`ColorField`'s eye dropper ties each sample to its open picker. A newer sample, closing the picker or unmounting the field aborts the pending sample through the EyeDropper API's `signal`, and a colour that arrives after that no longer calls `onChange`.
