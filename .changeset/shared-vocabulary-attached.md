---
'@flamboyantengineer/ui-components': minor
---

Props name the shared vocabulary directly. The aliases `ButtonSize`, `SegmentedChoiceSize`, `BreadcrumbSize` and `ComboboxSize` are removed in favour of `ControlSize`, and `BadgeTone`, `BannerTone`, `ModalTone`, `StatusLightTone` and `TagTone` in favour of `Tone`. Joining controls is no longer a density: `ButtonGroup` takes `attached` (publishing `data-attached`) beside `density="default" | "compact"`, and `ToolbarRowGroup` takes `attached` in place of `density`; `ButtonGroupDensity` and `ToolbarRowGroupDensity` are removed.
