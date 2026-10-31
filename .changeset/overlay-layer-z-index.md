---
'@flamboyantengineer/ui-components': minor
---

`Tooltip` and `AnchoredTooltip` panels sit on the `tooltip` overlay layer, and the `ColorField` and `EmojiPickerTrigger` popovers on the `dropdown` layer: each publishes `data-layer` and takes its inline z-index from `useLayerZIndex` instead of React Aria's 100000, so hover tooltips stack below toasts, the colour and emoji popovers below context menus, tooltips and toasts, and a `PortalHost`'s `layerZIndex` reaches all of them.
