---
'@flamboyantengineer/ui-components': minor
---

Add full-label tooltips, preset and action menus, and button shortcuts. `Breadcrumb` labels (new `ui-breadcrumb__label` slot) and `Path` show a cut label whole in a tooltip; `Path`'s root is now a `TruncationTooltip`, which forwards native `<span>` props and `ref`. `ZoomControl` takes `presets` and `onPresetAction` for a preset menu (new `ui-zoom-control__presets` slot, `ZoomPreset` type and `zoomPresets` string). `ActionRow` actions take typed menu `items` and `onAction`; the `wrap` option is removed. `Button`, `IconButton` and `ActionButton` take a `shortcut` shown in the tooltip and published as `aria-keyshortcuts`, through the new `formatAriaKeyShortcuts`. A framed section is a `Card`, whose reference title now matches the section header's metrics.
