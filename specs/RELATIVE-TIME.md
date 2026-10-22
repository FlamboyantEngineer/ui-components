# Relative Time

`RelativeTime` shows a timestamp relative to now (`5 minutes ago`, `Yesterday`, `In 3 days`) in a `<time>` element, keeps it current on one clock shared by every timestamp on the page, and shows the absolute date in a tooltip. Values are ISO 8601 texts and the words come from `Intl` in the provider's locale. [Attribution](ATTRIBUTION.md) places it in a sentence; [Relative Date Field](RELATIVE-DATE-FIELD.md) reads its value with the same formatter.

## UIC-RELATIVE-TIME-1 - Contract

### UIC-RELATIVE-TIME-1.1 - Time element

`RelativeTime` shall render a `ui-relative-time` `<time>` element whose `dateTime` is `value` as given, an ISO 8601 date (`YYYY-MM-DD`) or date and time (local, or with an offset or `Z`, read as the local wall time of its instant). It publishes `data-relation` (`past`, `present` or `future`) and `data-format`: `relative` while the text reads relative to now, `absolute` once it reads as the absolute date.

Implementation: `src/components/relative-time/relative-time.tsx`, `src/utils/relative-time.ts`
Verification: `src/components/relative-time/relative-time.test.tsx`, `e2e/relative-time.spec.ts`

### UIC-RELATIVE-TIME-1.2 - Relative words

The text shall read the value relative to `getNow()` (the current time by default) in the provider locale's words: a date and time within a day in seconds, minutes or hours (`5 minutes ago`, `In 2 hours`, `Now`), a value within `fallbackAfterDays` calendar days (7 by default) in days (`Today`, `Yesterday`, `In 3 days`), and anything farther as its absolute date. `capitalize` (true by default) upper-cases the first letter of relative words, as at the start of a label; `false` keeps the form `Intl` gives mid-sentence (`yesterday`, `in 2 hours`). An absolute date is never re-cased.

Implementation: `src/components/relative-time/relative-time.tsx`, `src/utils/relative-time.ts`
Verification: `src/components/relative-time/relative-time.test.tsx`, `src/utils/relative-time.test.ts`, `e2e/relative-time.spec.ts`

### UIC-RELATIVE-TIME-1.3 - Absolute date

The absolute text, in the tooltip and as the fallback, shall format the value with `Intl.DateTimeFormat` in the provider locale, with `dateStyle` (`full`, `long`, `medium` by default, `short`) and, for a date and time, `timeStyle` (`short` by default). A date has no time part.

Implementation: `src/components/relative-time/relative-time.tsx`, `src/utils/relative-time.ts`
Verification: `src/components/relative-time/relative-time.test.tsx`, `src/utils/relative-time.test.ts`

### UIC-RELATIVE-TIME-1.4 - Missing values

A missing, empty or unreadable `value` shall render `placeholder` in a `ui-relative-time` `<span>` publishing `data-empty`, with no `<time>` element, tooltip or tab stop; `capitalize` applies to it. Without a `placeholder` nothing renders.

Implementation: `src/components/relative-time/relative-time.tsx`
Verification: `src/components/relative-time/relative-time.test.tsx`

### UIC-RELATIVE-TIME-1.5 - Hooks and caller attributes

`RelativeTime` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/relative-time/relative-time.tsx`
Verification: `src/components/relative-time/relative-time.test.tsx`

## UIC-RELATIVE-TIME-2 - Updating

### UIC-RELATIVE-TIME-2.1 - Shared formatter

`describeRelativeTime(value, { now, locale, fallbackAfterDays, dateStyle, timeStyle })` in `src/utils/relative-time.ts` shall return the relative words in their mid-sentence form, the absolute text, the relation, whether the words read relative, and `nextChange`: the milliseconds until the words may read differently (the next rounding step of seconds, minutes or hours, the switch to days after a day, or the next local midnight for day counts), or `null` for a past value already read as its absolute date. It returns `null` for a value that is not a date. `capitalizeText` upper-cases the first letter in the locale. Relative Time and Relative Date Field both read values through it.

Implementation: `src/utils/relative-time.ts`, `src/components/relative-date-field/relative-date.ts`
Verification: `src/utils/relative-time.test.ts`, `src/components/relative-date-field/relative-date.test.ts`

### UIC-RELATIVE-TIME-2.2 - One shared clock

A mounted `RelativeTime` shall render again when its `nextChange` comes due, so `Now` becomes `1 minute ago` and `Today` becomes `Yesterday` at midnight without the caller re-rendering. Every timestamp on the page shares one timer, set for the earliest moment any of them needs; it stops when none is mounted or none can change. Subscriptions sharing a deadline are counted together, so adding or cancelling one does not rescan the other callbacks at that deadline. A callback cancelled or rescheduled by an earlier wake callback shall not fire from the old due batch.

Implementation: `src/components/relative-time/relative-time-clock.ts`, `src/components/relative-time/relative-time.tsx`
Verification: `src/components/relative-time/relative-time-clock.test.ts`, `src/components/relative-time/relative-time.test.tsx`, `e2e/relative-time.spec.ts`

## UIC-RELATIVE-TIME-3 - Accessibility

### UIC-RELATIVE-TIME-3.1 - Absolute date tooltip

While the text reads relative, the `<time>` element shall show the absolute text in a [Tooltip](TOOLTIP.md) (`ui-relative-time__tooltip`, also `ui-tooltip`) when the pointer rests on it and when keyboard focus reaches it. The element then takes focus, one tab stop driven by React Aria's tooltip trigger, and is described by the tooltip while it is open; Escape, a press or leaving it closes the tooltip, as does scrolling. With `showTooltip={false}`, or once the text already reads as the absolute date, there is no tooltip and no tab stop.

Implementation: `src/components/relative-time/relative-time.tsx`, `src/components/relative-time/relative-time-tooltip.tsx`, `labs/reference/relative-time.css`
Verification: `src/components/relative-time/relative-time.test.tsx`, `e2e/relative-time.spec.ts`

### UIC-RELATIVE-TIME-3.2 - Visible text is the content

`RelativeTime` shall add no role and no accessible name: the visible words are what assistive technology reads, and the absolute date reaches it through the tooltip's description. A `<time>` element cannot be named by `aria-label`.

Implementation: `src/components/relative-time/relative-time.tsx`
Verification: `src/components/relative-time/relative-time.test.tsx`, `e2e/relative-time.spec.ts`

## Hooks

| Hook                        | Kind  | Values                      | Description                                                |
| --------------------------- | ----- | --------------------------- | ---------------------------------------------------------- |
| `ui-relative-time`          | root  |                             | The `<time>` element, or the placeholder's `<span>`.       |
| `ui-relative-time__tooltip` | slot  |                             | The tooltip holding the absolute date (also `ui-tooltip`). |
| `data-relation`             | state | `past`, `present`, `future` | Whether the value lies before, at or after now.            |
| `data-format`               | state | `relative`, `absolute`      | Whether the text reads relative or as the absolute date.   |
| `data-empty`                | state | `true`                      | The placeholder of a missing or unreadable value.          |
