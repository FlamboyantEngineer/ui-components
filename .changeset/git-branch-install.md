---
'@flamboyantengineer/ui-components': patch
---

A branch or commit installed as an npm Git dependency now works without committed build output: the `prepare` script builds the entry points, their declarations and `labs/build/reference.css`, skipping the lab bundles.
