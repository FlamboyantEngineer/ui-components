---
'@flamboyantengineer/ui-components': minor
---

Stacking between nested parts follows one scale: blocking modals publish `data-stack-index` (a modal over another takes the weaker scrim in the reference stylesheet), the resize handle's drag shield renders through a portal on the top overlay layer, and overlay scroll tracks paint above sticky headers.
