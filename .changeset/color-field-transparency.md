---
'@flamboyantengineer/ui-components': minor
---

ColorField takes `allowsTransparency`, which adds the alpha slider and input and writes the colour with its alpha. `ColorFieldFormat` is now `hex`, `rgb`, `hsl` or `hsb`: the `hexa`, `rgba`, `hsla` and `hsba` formats are removed, so pass `allowsTransparency` with the plain format instead. Without transparency editing the picker never changes the alpha, and a translucent value keeps and shows it.
