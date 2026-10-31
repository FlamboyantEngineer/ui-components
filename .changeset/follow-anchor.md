---
'@flamboyantengineer/ui-components': patch
---

`AnchoredTooltip`, menus (`MenuPopover`, `MenuOverlay`, context-menu point anchors) and `CompletionList` follow their anchor through one shared mechanism: any scroll in the anchor's document, a resize of its window, a size change of the anchor, or a moved point places the open overlay again, listening on the anchor's own window. Menus no longer alternate between spellings of a placement, and a modal context menu follows a moved point too. `autoUpdateOverlay`'s `overlay` is now optional.
