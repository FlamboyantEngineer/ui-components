---
'@flamboyantengineer/ui-components': minor
---

Merge `Slider` and `RangeSlider` into `NumberField` (#1384). `display="slider"` draws a number on a track, and `range` makes the field hold a start and an end (`NumberRange`), typed into two inputs by default or picked with two thumbs with `display="slider"`. A slider can also edit its value in inputs before the track with `valueLabel="input"`.

Migration: replace `<Slider …/>` with `<NumberField display="slider" …/>` and `<RangeSlider …/>` with `<NumberField range display="slider" …/>`. `RangeValue` is now `NumberRange`, `SliderMark` is `NumberFieldMark`, `SliderValueLabel` is `NumberFieldValueLabel`, and `SliderProps` and `RangeSliderProps` are `NumberSliderFieldProps` and `NumberRangeFieldProps`. `keepThumbsApart`, `normalizeSliderValue`, `snapToStep` and `SliderGrid` move to the `number-field` entry point. The hooks move from `ui-slider` and `ui-range-slider` to `ui-number-field` with `data-display="slider"` and `data-range`; `ui-slider__box` is `ui-number-field__slider` and every other `ui-slider__*` slot is `ui-number-field__*`. The reference sheet's slider rules move to `number-field.css`.
