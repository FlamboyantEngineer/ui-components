# Relative Time

`RelativeTime` shows a timestamp relative to now (`5 minutes ago`, `Yesterday`, `In 3 days`) in a `<time>` element, keeps it current on one clock shared by every timestamp on the page, and shows the absolute date in a tooltip. Values are ISO 8601 texts and the words come from `Intl` in the provider's locale. [Attribution](ATTRIBUTION.md) places it in a sentence; [Relative Date Field](RELATIVE-DATE-FIELD.md) reads its value with the same formatter.

## UIC-RELATIVE-TIME-1 - Contract

### UIC-RELATIVE-TIME-1.1 - Time element

`RelativeTime` shall render a `ui-relative-time` `<time>` element whose `dateTime` is `value` as given, an ISO 8601 date (`YYYY-MM-DD`) or date and time (local, or with an offset, `Z` or a bracketed zone). A value with an offset or a zone keeps its exact instant, also in an hour that daylight saving time repeats, and reads on the local calendar day of that instant; a value with neither is local wall time, its first occurrence when the hour repeats. It publishes `data-relation` (`past`, `present` or `future`) and `data-format`: `relative` while the text reads relative to now, `absolute` once it reads as the absolute date.

Implementation: `src/components/relative-time/relative-time.tsx`, `src/utils/relative-time.ts`
Verification: `src/components/relative-time/relative-time.test.tsx`, `e2e/relative-time.spec.ts`

### UIC-RELATIVE-TIME-1.2 - Relative words

The text shall read the value relative to `getNow()` (the current time by default) in the provider locale's words: a date and time within a day in minutes or hours, by `precision`, a value within `fallbackAfterDays` calendar days (7 by default) in days (`Today`, `Yesterday`, `In 3 days`), and anything farther as its absolute date. With `precision="minute"` (the default) an instant less than a minute away reads `Now`, then counts whole elapsed minutes (`1 minute ago` from 60 seconds to 119 seconds, `In 1 minute`), and from an hour away reads in rounded hours. With `precision="second"` it counts live seconds (`5 seconds ago`, `Now` at zero), minutes and hours by the rounded count, so it never reads 60 seconds, 60 minutes or 24 hours (59.7 seconds ago reads `1 minute ago`). In both, an instant whose hours round to 24 reads in days. `unitStyle` is the `Intl.RelativeTimeFormat` style that spells the units: `long` by default (`5 minutes ago`), `short` (`5 min. ago`) or `narrow` (`5m ago`), as the locale words them. `capitalize` (true by default) upper-cases the first letter of relative words, as at the start of a label; `false` keeps the form `Intl` gives mid-sentence (`yesterday`, `in 2 hours`). An absolute date is never re-cased.

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

`describeRelativeTime(value, { now, locale, fallbackAfterDays, precision, unitStyle, dateStyle, timeStyle })` in `src/utils/relative-time.ts` shall return the relative words in their mid-sentence form, the absolute text, the relation, whether the words read relative, and `nextChange`: the milliseconds until the words may read differently (the next whole minute, the next rounding step of seconds, minutes or hours, the switch to the next or previous unit when the rounded count crosses 60 seconds, 60 minutes or 24 hours, or the next local midnight for day counts), or `null` for a past value already read as its absolute date. `precision` defaults to `minute` and `unitStyle` to `long`. It returns `null` for a value that is not a date. `capitalizeText` upper-cases the first letter in the locale. Relative Time and Relative Date Field both read values through it.

Implementation: `src/utils/relative-time.ts`, `src/components/relative-date-field/relative-date.ts`
Verification: `src/utils/relative-time.test.ts`, `src/components/relative-date-field/relative-date.test.ts`

### UIC-RELATIVE-TIME-2.2 - One shared clock

A mounted `RelativeTime` shall render again when its `nextChange` comes due, so `Now` becomes `1 minute ago` (or, with second precision, `1 second ago`) and `Today` becomes `Yesterday` at midnight without the caller re-rendering. Every timestamp on the page shares one timer, set for the earliest moment any of them needs; it stops when none is mounted or none can change. Subscriptions sharing a deadline are counted together, so adding or cancelling one does not rescan the other callbacks at that deadline. A callback cancelled or rescheduled by an earlier wake callback shall not fire from the old due batch. A clock that has not moved since the previous wake, such as a fixed `getNow`, is frozen: the timestamp wakes for it at most once, finds the same time, and waits for its next render (a new `value` or `getNow`) instead of waking again, so a clock stopped at a boundary never wakes it every millisecond. A live clock keeps waking it at each change.

Implementation: `src/components/relative-time/relative-time-clock.ts`, `src/components/relative-time/relative-time.tsx`
Verification: `src/components/relative-time/relative-time-clock.test.ts`, `src/components/relative-time/relative-time.test.tsx`, `e2e/relative-time.spec.ts`

### UIC-RELATIVE-TIME-2.3 - Server rendering and hydration

On the server and while a client hydrates server markup, `RelativeTime` shall not read the clock: it renders the same `<time>` on both, whenever and in whichever time zone each runs, with `data-format="absolute"`, no `data-relation`, no tooltip and no tab stop, and the stable absolute text of `formatStableTime(value, locale, { dateStyle, timeStyle })`. That text is a date as itself, a date and time without an offset as its wall time, and an instant in UTC with the zone named (a `long` time at least, as `Oct 31, 2026, 12:00:00 PM UTC`). Once hydrated it reads `getNow()` (the default clock or the caller's) and renders the live words, relation, format and tooltip, then follows the shared clock. A client render that hydrates nothing reads the clock at once.

Implementation: `src/components/relative-time/relative-time.tsx`, `src/utils/relative-time.ts`
Verification: `src/components/relative-time/relative-time.test.tsx`, `src/utils/relative-time.test.ts`, `e2e/relative-time.spec.ts`

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
