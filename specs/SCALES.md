# Scales

`createLinearScale`, `createTimeScale` and `createBandScale` map data values to positions, such as pixels along an axis, and make the ticks an axis labels. [Sparkline](SPARKLINE.md) draws with a linear scale; charts and time-based views build on them. They are pure functions with no dependency on the page, so a host can use them for its own drawings.

The linear and time scales return a scale whose `map` turns a value into a position, whose `invert` turns a position back into a value, whose `ticks` lists `{ value, position, label }` marks, and whose `format` writes a value as a tick label. The band scale maps categories to the bands of a bar chart and ticks the middle of each band.

## UIC-SCALES-1 - Linear scale

### UIC-SCALES-1.1 - Mapping

`createLinearScale({ domain, range })` shall map a value to a position in proportion: the first end of the domain to the first end of the range and the second to the second, so reversed ends flip the scale (a vertical axis whose values grow upward). Finite endpoints shall keep mapping correctly when their difference overflows. Values beyond the domain extrapolate unless `clamp` is set, which keeps positions inside the range. `invert` maps a position back to its value, also clamped when `clamp` is set. The scale exposes its `domain` and `range`.

Implementation: `src/utils/linear-scale.ts`
Verification: `src/utils/linear-scale.test.ts`, `e2e/sparkline.spec.ts`

### UIC-SCALES-1.2 - Truthful edges

An end of the domain or range that is not a finite number shall read as 0. A domain whose ends are equal maps every value to the middle of the range and has one tick, at that value. `map` and `invert` return `NaN` for a point that is not a finite number, so a caller skips it rather than drawing it at an edge.

Implementation: `src/utils/linear-scale.ts`
Verification: `src/utils/linear-scale.test.ts`

### UIC-SCALES-1.3 - Ticks

`ticks()` shall return the multiples of a round step that fall inside the domain, in increasing order, each with its position and label. The step is 1, 2 or 5 times a power of ten, chosen so that about `tickCount` steps (5 by default, with the request clamped to 1–1000) span the domain; values are written without floating-point noise (`0.3`, not `0.30000000000000004`). Tick generation shall terminate for adjacent representable numbers, return no duplicate values and use the smallest positive number when a step underflows. An unrepresentable step falls back to one tick at the lower end.

Implementation: `src/utils/linear-scale.ts`
Verification: `src/utils/linear-scale.test.ts`

### UIC-SCALES-1.4 - Nice domain

With `nice`, the scale shall extend its domain outward to the nearest multiples of its tick step, keeping the domain's direction, so the first and last ticks sit at the ends of the range. An endpoint shall stay unchanged if rounding it outward would overflow to infinity.

Implementation: `src/utils/linear-scale.ts`
Verification: `src/utils/linear-scale.test.ts`

### UIC-SCALES-1.5 - Labels

`format(value)` and the tick labels shall write numbers for `locale` (the runtime's by default) with exactly as many decimals as the tick step has (`0.0`, `0.2`, … for a step of 0.2). Steps requiring more than 100 decimal places shall use scientific notation instead of exceeding fixed-precision formatting limits. `formatOptions` (`Intl.NumberFormatOptions`, such as a percent or a unit) replaces that default.

Implementation: `src/utils/linear-scale.ts`
Verification: `src/utils/linear-scale.test.ts`

## UIC-SCALES-2 - Time scale

### UIC-SCALES-2.1 - Mapping

`createTimeScale({ domain, range })` shall take its domain and values as ISO 8601 texts and map them to positions linearly in elapsed time. A date (`2026-03-01`) stands for its first instant, a date-time with an offset or a zone for that instant, and a floating date-time for that wall time, all read in `timeZone` (an IANA name; the runtime's zone by default). `invert` returns the instant at a position as an ISO 8601 date-time in UTC (`2026-03-01T12:00:00.000Z`).

Implementation: `src/utils/time-scale.ts`, `src/primitives/date-values.ts`
Verification: `src/utils/time-scale.test.ts`

### UIC-SCALES-2.2 - Truthful edges

A value that is not an ISO 8601 date or date-time shall map to `NaN` and format as empty text. When an end of the domain is not one, every value maps to `NaN`, there are no ticks, and `invert` returns empty text, as it does for a position that is not a finite number.

Implementation: `src/utils/time-scale.ts`
Verification: `src/utils/time-scale.test.ts`

### UIC-SCALES-2.3 - Calendar ticks

`ticks({ unit })` shall return the starts of the calendar days, weeks, months, quarters (January, April, July, October) or years that fall inside the domain, as `YYYY-MM-DD` dates in increasing order, each positioned at midnight in the scale's time zone, so ticks stay on calendar boundaries across daylight saving changes. Weeks start on the first day of the week of `locale`. Tick generation shall stop at the supported calendar limit without repeating dates or emitting a clamped date between unit boundaries.

Implementation: `src/utils/time-scale.ts`
Verification: `src/utils/time-scale.test.ts`, `e2e/sparkline.spec.ts`

### UIC-SCALES-2.4 - Choosing a unit

Without `unit`, `ticks` shall use the smallest of day, week, month, quarter and year whose actual calendar boundaries inside the domain number at most `count` (8 by default). When even years are too many, it ticks every n years, at multiples of n, with n the smallest step that fits.

Implementation: `src/utils/time-scale.ts`
Verification: `src/utils/time-scale.test.ts`, `src/components/chart/line-geometry.test.ts`, `e2e/sparkline.spec.ts`

### UIC-SCALES-2.5 - Labels

`format(value, unit)` and the tick labels shall write dates in the scale's time zone for `locale`: the month and day for days and weeks (`Mar 5`), the month and year for months and quarters (`Apr 2026`), and the year for years.

Implementation: `src/utils/time-scale.ts`
Verification: `src/utils/time-scale.test.ts`

### UIC-SCALES-2.6 - Calendar units

`floorToTimeUnit(date, unit, locale)` shall return the first day of the day, week, month, quarter or year holding a `YYYY-MM-DD` date (weeks starting on the first day of the week of `locale`), and `addTimeUnits(date, unit, count)` the date moved by a whole number of those units, forward or back, a day past the end of the target month clamping to its last day (January 31 plus one month is February 28). Both return `YYYY-MM-DD` dates, and empty text for a text that is not a date or a count that is not a finite number. [Timeline](TIMELINE.md) steps and pads its range with them.

Implementation: `src/utils/time-scale.ts`
Verification: `src/utils/time-scale.test.ts`

## UIC-SCALES-3 - Band scale

### UIC-SCALES-3.1 - Bands

`createBandScale({ domain, range, padding })` shall split the range into one equal step per category of the domain, in order, each holding a band `padding` of a step shorter (0.2 by default, kept between 0 and 1) and centred in its step, so half the padding sits at each outer edge. `map(category)` returns where the category's band starts, at its lower position, and the scale exposes its `step` and `bandwidth`. Reversed ends of the range lay the bands out from the second end. [Bar Chart](CHART.md) lays its bars out with it.

Implementation: `src/utils/band-scale.ts`
Verification: `src/utils/band-scale.test.ts`

### UIC-SCALES-3.2 - Ticks

`ticks()` shall return one tick per category, positioned at the middle of its band and labelled with the category.

Implementation: `src/utils/band-scale.ts`
Verification: `src/utils/band-scale.test.ts`

### UIC-SCALES-3.3 - Truthful edges

A category that is not in the domain shall map to `NaN`; a repeated category keeps its first band; an end of the range that is not a finite number reads as 0; an empty domain has a step and bandwidth of 0 and no ticks.

Implementation: `src/utils/band-scale.ts`
Verification: `src/utils/band-scale.test.ts`
