---
'@flamboyantengineer/ui-components': patch
---

`AnchoredTooltip` follows a stable ref to the element it holds now: a replacement element takes over the description and the position, an anchor that leaves the page hides the hint and releases its relationship, and one put back shows it again, also when the change happens outside the tooltip's own renders.
