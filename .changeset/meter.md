---
'@flamboyantengineer/ui-components': minor
---

Add `Meter`, a measured quantity inside a known range, such as storage used or a battery's charge. It has the meter role, a visible label or accessible name, an optional `description` that describes it, locale-formatted value text (`formatOptions` or `valueLabel`), `low`, `high` and `optimum` thresholds that judge its `data-tone` as the HTML `meter` element's regions do, and a linear track or a circular ring. It never claims progress: it has no indeterminate or complete state. Its hooks are `ui-meter` with the `label`, `value`, `track`, `fill`, `ring` and `description` slots, and the reference stylesheet draws it as a progress bar. `ProgressBar` now shows only work toward completion: its `mode`, `low`, `high` and `optimum` props, the `ProgressBarMode` type and its `data-mode` attribute are gone, and a measured quantity renders `Meter` instead.
