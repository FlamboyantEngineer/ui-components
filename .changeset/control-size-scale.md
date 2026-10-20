---
'@flamboyantengineer/ui-components': minor
---

Controls share one size scale. Every field control built on `Field`, plus `Checkbox` and `Switch`, takes `size` (`xs`, `sm`, `md` by default, `lg`, the new shared `ControlSize` type) and publishes `data-size`. A field's restore, help and menu buttons take the size one step below the field's. `SegmentedChoice`, `SearchField`, `Slider` and `RadioGroup` gain `xs` (and `SearchField` gains `lg`). Selection checkboxes in rows, toolbar switches and the rich text block-type select now pass `size="sm"`. The reference stylesheet draws every single-line control at 20, 24, 28 or 32 pixels for `xs` to `lg` from new `--ref-control-height-*` tokens, whatever its content: buttons and icon buttons become one step denser (`md` is now 28 pixels, was 32), and fields keep 28 pixels at `md`. `npm run check:labs` rejects a control height off the scale.
