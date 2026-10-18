---
'@flamboyantengineer/ui-components': minor
---

Add sliders and radio groups as field controls.

- `Slider` (new, React Aria `Slider`): a field for a number with the field's label, description, validation, dirty state, undo and menu. `minValue`, `maxValue`, `step`, `orientation`, `formatOptions`, `onChangeEnd` and `name` pass to React Aria; `marks` (with labels, `data-in-range`), `valueLabel` (`output`, `thumb`, `none`), `fillOffset` and `size` (`sm`, `md`, `lg`). Each drag or key press commits. Hooks: `ui-slider`, `__box`, `__output`, `__track`, `__fill`, `__mark`, `__mark-label`, `__thumb`, `__thumb-label`, `data-size`, `data-value-label`, `data-in-range`.
- `RangeSlider` (new): the slider's parts with two thumbs for a `[start, end]` value that never cross, `minStepsBetweenThumbs`, thumbs named by the new strings `rangeMinimum` and `rangeMaximum`, and `keepThumbsApart`. Hook: `ui-range-slider` beside `ui-slider`.
- `RadioGroup` and `Radio` (new, React Aria `RadioGroup`, `RadioField` and `RadioButton`): a field for one value picked from radios, with `orientation`, `size`, required validation, `isReadOnly` and `isDisabled`, and radios with rich label content, a `description` and their own `isDisabled`. Hooks: `ui-radio-group`, `__box`, `data-size`, `ui-radio`, `__button`, `__indicator`, `__label`, `__description`.
