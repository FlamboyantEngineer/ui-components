---
'@flamboyantengineer/ui-components': minor
---

Add a segmented bar, a sparkline, a stat tile and pure scale utilities.

- `SegmentedBar` (new): one bar split into proportional `segments` (`id`, `label`, `value`, `tone`), with `label`, `total` (a larger total leaves the rest empty), `showTotal`, `showLegend`, `size` and `formatOptions`. A named group whose summary list reads every segment's count and share, visually hidden unless the legend shows. Hooks: `ui-segmented-bar`, `__label`, `__total`, `__track`, `__segment`, `__legend`, `__item`, `__swatch`, `__item-label`, `__item-value`, `__item-share`, `data-size`, `data-tone`.
- `Sparkline` (new): a word-sized SVG line or area of `values` with `variant`, `markers` (`min`, `max`, `last`), `minValue`/`maxValue`, `width`, `height` and `formatOptions`; gaps for values that are not finite; an image described by its lowest, highest and last values. Hooks: `ui-sparkline`, `__area`, `__line`, `__marker`, `data-variant`, `data-marker`, `data-empty`.
- `StatTile` (new, renders `Card`): `label`, `value`, `valueLabel`, `formatOptions`, `delta`, `deltaFormatOptions`, `goal` (`increase`, `decrease`, `none`), `description`, `chart`, `isLoading`, `href`/`target`/`rel`/`onAction`. Hooks: `ui-stat-tile`, `__value`, `__delta`, `__trend-icon`, `__description`, `__chart`, `data-trend`, `data-tone`.
- `createLinearScale` and `createTimeScale` (new utilities): map values or ISO 8601 dates to positions and back, with nice numeric ticks and calendar ticks by day, week, month, quarter or year, labelled for the locale (`specs/SCALES.md`).
- Glyphs: `trend-up`, `trend-down`, `trend-flat`. Strings: `totalCount`, `noData`, `seriesSummary`.
