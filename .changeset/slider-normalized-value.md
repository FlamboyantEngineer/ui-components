---
'@flamboyantengineer/ui-components': minor
---

`Slider` and `RangeSlider` hold one normalized value: a given value is snapped onto the step grid, clamped into the bounds and a range put in order, so validation, callbacks and form data agree with what the thumbs show. A held value that leaves the grid when the bounds or step change moves onto it as a change. Spaced fractional ranges stay on the grid (`0.2`, not `0.19999999999999998`). New helpers `snapToStep` and `normalizeSliderValue`.
