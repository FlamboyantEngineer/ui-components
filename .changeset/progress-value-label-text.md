---
'@flamboyantengineer/ui-components': minor
---

`valueLabel` on `ProgressBar` (linear, circular, meter and segmented) and on `LoadingCard`'s `progress` is now plain text (`string`) instead of any React node, so `aria-valuetext` always reads what the bar shows. Blank text, or anything but text, keeps the formatted value.
