# Calendar View

`CalendarView` shows events on a calendar, in a month view or a week view: due dates, reviews, releases, meetings. Events are plain data on ISO 8601 dates (all-day) or date-times (timed), placed on days and hours in a time zone. A toolbar moves by month or week, back to today and between the views; the grid of days is navigated by keyboard like a date picker's calendar, but each day holds its events, a crowded month day lists the rest behind `+n more`, and the week view places timed events on a time grid with [time scales](SCALES.md). For picking a date, use [Date Time Field](DATE-TIME-FIELD.md).

## UIC-CALENDAR-VIEW-1 - Views and navigation

### UIC-CALENDAR-VIEW-1.1 - Month view

In the month view (`view="month"`, the default) the calendar shall render a grid (`ui-calendar-view__grid`) whose first row (`ui-calendar-view__weekdays`) holds a column header per weekday (`ui-calendar-view__weekday`), from the locale's first day of the week, showing the short name and named by the full name (visually hidden text), followed by one row (`ui-calendar-view__week`) per week that shows part of the focused day's month. Each day is a cell (`ui-calendar-view__day`) publishing its date as `data-date`, showing its day of the month (`ui-calendar-view__day-number`) and its events (`ui-calendar-view__events`); days of the neighbouring months publish `data-outside-month`.

Implementation: `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-day.tsx`, `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `e2e/calendar-view.spec.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-1.2 - Week view

In the week view (`view="week"`) the grid's first row shall hold a column header per day of the focused day's week, showing its short weekday name and its day of the month (`ui-calendar-view__day-number`) and named by the day in full, followed by one row of day cells, each holding an all-day area (`ui-calendar-view__all-day`) for bars and a time grid (`ui-calendar-view__timed`) for timed events. A decorative gutter (`ui-calendar-view__gutter`) leads both rows; in the day row it shows the provider's `allDay` string beside the all-day areas and the hours of the day (`ui-calendar-view__hour`) beside the time grids, each placed at its share of the day.

Implementation: `src/components/calendar-view/calendar-week.tsx`, `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `e2e/calendar-view.spec.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-1.3 - Toolbar

A toolbar (`ui-calendar-view__toolbar`) shall precede the grid with a [Button](BUTTON.md) reading the provider's `today` string that moves the focused day to today (`ui-calendar-view__today`), previous and next [icon-only buttons](BUTTON.md) named by the provider's `previousRange` and `nextRange` strings for the view's unit that move it by a month or a week (`ui-calendar-view__previous`, `ui-calendar-view__next`, their chevrons mirrored right to left), the period on show (`ui-calendar-view__title`: the month and year, or the week's date range), which names the grid and is a polite live region, and a [SegmentedChoice](SEGMENTED-CHOICE.md) between the `views` (`ui-calendar-view__views`, named by the provider's `calendarViews` string, its options the `month` and `week` strings). With one view in `views` the choice is not shown. The view is controlled with `view` and `onViewChange` or uncontrolled from `defaultView`; the focused day (`YYYY-MM-DD`) with `date` and `onDateChange` or uncontrolled from `defaultDate`, today by default. The root publishes the view as `data-view`.

Implementation: `src/components/calendar-view/calendar-view.tsx`, `src/core/strings/planning.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-1.4 - Today

`getNow` (the provider's clock by default, else the current time) shall decide today in the view's time zone (`timeZone`, else the provider's, else the browser's). A server render and its hydration never read the clock ([UIC-PROVIDER-8.2](PROVIDER.md)): they mark no day as today, and without `date` or `defaultDate` they draw only the busy (`aria-busy`) root, which fills in on the first client render. The Today button reads the clock when pressed. Today's cell carries `aria-current="date"` and `data-today`, and in the week view today's column header publishes `data-today` too.

Implementation: `src/components/calendar-view/calendar-view.tsx`, `src/components/calendar-view/calendar-day.tsx`, `src/components/calendar-view/calendar-week.tsx`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-1.5 - Time zone and locale

Events shall be placed on days and hours in `timeZone` (the runtime's by default): a date-time with an offset or a zone converts to it, and a floating one reads as wall time in it. The first day of the week, the names of days and months, times and date ranges follow the provider's locale.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/use-calendar-format.ts`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-days.test.ts`

## UIC-CALENDAR-VIEW-2 - Events

### UIC-CALENDAR-VIEW-2.1 - Event data

Each event shall have an `id`, a `title` and a `start`: a `YYYY-MM-DD` date makes it an all-day event, an ISO 8601 date-time a timed one. `end` is the last day of an all-day event, inclusive, or the end of a timed event, exclusive; without it an all-day event lasts its start day and a timed event an hour. An end before the start is read as the start. Events whose start is neither are left out. Numeric and text IDs with the same spelling identify distinct events, retaining their rendered identity and callback keys when reordered in the week view or a crowded-day list. `tone` (`neutral` by default) is published as `data-tone`.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`

### UIC-CALENDAR-VIEW-2.2 - Event buttons

Each event shall render a button (`ui-calendar-view__event`) named by the provider's `calendarEvent` string with its title and when it happens (its day or days, or its times), in visually hidden text that stands in for the visible parts, showing its title (`ui-calendar-view__event-title`) after its start time in the month view or its time range in the week view (`ui-calendar-view__event-time`; all-day events show no time). All-day events publish `data-all-day`. A press, Enter or Space calls `onEventAction` with the event's `id`. An event's button belongs to its `id` (numeric and text ids stay distinct), not to its lane: when events are added, removed or changed and the lanes are packed again, a focused event keeps its button and focus, so Enter or Space still reports its own `id`. A focused event that leaves the view (removed, or hidden behind a crowded day's more button) hands focus to its day cell; its button is never reused for another event.

Implementation: `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-2.3 - Bars across days

All-day events, and timed events lasting 24 hours or more, shall be drawn as bars across the days they cover in each week: a bar renders in the cell of its first day in the week with an inline width of its number of days times 100%, publishing `data-continues-before` when the event started in an earlier week and `data-continues-after` when it goes on into a later one. Each week packs its events into lanes, each taking the first lane free across its days: bars first, then by start day, longer bars first, then by start time. Where a day's lane is taken by a bar from an earlier day, or empty below a used lane, the cell holds a decorative spacer (`ui-calendar-view__spacer`), so lanes line up across the week. In the month view a week's lanes hold all its events; in the week view they hold the bars, padded to the same count on every day.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-week.tsx`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-2.4 - Crowded days

A month cell shall show at most `maxEvents` rows (3 by default). When a day of the week covers more events than that, the week shows one lane fewer, and each day with hidden events ends with a [Button](BUTTON.md) (`ui-calendar-view__more`) reading the provider's `moreEvents` string with the count hidden there (`+2 more`), which opens a [Popover](POPOVER.md) titled by the day in full listing all of the day's events (`ui-calendar-view__more-list`).

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-2.5 - Time grid

In the week view, timed events shorter than 24 hours shall be placed in the time grid of each day they touch, clipped to the day, with an inline absolute `top` and `height` in percent of the day. Every day shares one 24-hour wall-clock ruler, the gutter's hour labels at `hour / 24`: an instant sits at its wall-clock time of day in `timeZone`, so an event lines up with its hour label and with the same time on any other day, including days whose clocks change. A skipped hour (clocks going forward) stays on the ruler, empty, and an event across it spans it from its start to its end time. Both passes of a repeated hour (clocks going back) share its place, so their events overlap and sit side by side; an event whose end reads earlier than its start, running back through the repeated hour, keeps its elapsed length from its start. Events in a repeated hour keep their distinction in their times, which name the offset of each end (`1:30 AM EDT – 1:45 AM EDT`). Offsets that change by other amounts, such as half an hour, follow the same rules. Overlapping events share the day's width side by side, each with an inline `left` and `width` in percent. An event clipped at the start or end of the day publishes `data-continues-before` or `data-continues-after`; a zero-duration event keeps zero height.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-days.ts`, `src/components/calendar-view/calendar-week.tsx`, `src/components/calendar-view/use-calendar-format.ts`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-days.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

## UIC-CALENDAR-VIEW-3 - Days

### UIC-CALENDAR-VIEW-3.1 - Day content

`renderDay` shall draw extra content in every day cell (`ui-calendar-view__day-content`), before its events, given the day as `{ date, isToday, isOutsideMonth, events }` with `date` as `YYYY-MM-DD` and the events that cover the day. Empty content renders no slot.

Implementation: `src/components/calendar-view/calendar-day.tsx`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

## UIC-CALENDAR-VIEW-4 - Accessibility

### UIC-CALENDAR-VIEW-4.1 - Grid semantics

The grid shall be named by the period on show, with rows of column headers named by the full weekday (or, in the week view, the day in full) and of day cells whose names start with their day in full (`Monday, March 2, 2026`), each in visually hidden text that stands in for the short visible text. The day of the month and the gutter are hidden from assistive technology; each event names itself with its times.

Implementation: `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-week.tsx`, `src/components/calendar-view/calendar-day.tsx`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-4.2 - Keyboard

The grid shall be one tab stop, the focused day's cell. On a day cell ArrowLeft and ArrowRight move a day (mirrored right to left), ArrowUp and ArrowDown a week, Home and End to the first and last day of the week, and PageUp and PageDown a month in the month view or a week in the week view, always from the day of the cell that has focus, including a day of a neighbouring month; moving to a day of another month or week shows it, and focus follows to its cell. A move the owner of a controlled `date` does not apply leaves focus where it is, and a later change of `date` never takes focus. Only the focused day's events and `+n more` button are in the Tab sequence. Focus landing in a day of the period on show by other means makes it the focused day.

Implementation: `src/components/calendar-view/use-calendar-grid.ts`, `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-day.tsx`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `e2e/calendar-view.spec.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-4.3 - Hooks and caller attributes

`CalendarView` shall carry the hooks below, append the caller's `className` to the root, and forward `id`, `ref` and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/calendar-view/calendar-view.tsx`, `src/components/calendar-view/calendar-view-hooks.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`

## Hooks

| Hook                            | Kind      | Values                                            | Description                                           |
| ------------------------------- | --------- | ------------------------------------------------- | ----------------------------------------------------- |
| `ui-calendar-view`              | root      |                                                   | The calendar.                                         |
| `ui-calendar-view__toolbar`     | slot      |                                                   | The navigation and view controls.                     |
| `ui-calendar-view__today`       | slot      |                                                   | The Today button (also `ui-button`).                  |
| `ui-calendar-view__previous`    | slot      |                                                   | The previous month or week button (also `ui-button`). |
| `ui-calendar-view__next`        | slot      |                                                   | The next month or week button (also `ui-button`).     |
| `ui-calendar-view__title`       | slot      |                                                   | The period on show.                                   |
| `ui-calendar-view__views`       | slot      |                                                   | The choice of view (also `ui-segmented-choice`).      |
| `ui-calendar-view__grid`        | slot      |                                                   | The grid of days (`role="grid"`).                     |
| `ui-calendar-view__weekdays`    | slot      |                                                   | The row of column headers.                            |
| `ui-calendar-view__weekday`     | slot      |                                                   | A column header.                                      |
| `ui-calendar-view__week`        | slot      |                                                   | A row of days.                                        |
| `ui-calendar-view__gutter`      | slot      |                                                   | The week view's leading column of labels.             |
| `ui-calendar-view__hour`        | slot      |                                                   | An hour label of the time grid.                       |
| `ui-calendar-view__day`         | slot      |                                                   | A day cell (`role="gridcell"`).                       |
| `ui-calendar-view__day-number`  | slot      |                                                   | The day of the month.                                 |
| `ui-calendar-view__day-content` | slot      |                                                   | The caller's `renderDay` content.                     |
| `ui-calendar-view__events`      | slot      |                                                   | A month cell's events.                                |
| `ui-calendar-view__all-day`     | slot      |                                                   | A week day's bars, and the gutter's all-day label.    |
| `ui-calendar-view__timed`       | slot      |                                                   | A week day's time grid, and the gutter's hours.       |
| `ui-calendar-view__event`       | slot      |                                                   | An event button.                                      |
| `ui-calendar-view__event-time`  | slot      |                                                   | An event's start time or time range.                  |
| `ui-calendar-view__event-title` | slot      |                                                   | An event's title.                                     |
| `ui-calendar-view__spacer`      | slot      |                                                   | An empty or taken lane of a day.                      |
| `ui-calendar-view__more`        | slot      |                                                   | A crowded day's `+n more` button (also `ui-button`).  |
| `ui-calendar-view__more-list`   | slot      |                                                   | The events listed in the `+n more` popover.           |
| `data-view`                     | attribute | `month`, `week`                                   | The view on show.                                     |
| `data-tone`                     | attribute | `neutral`, `info`, `success`, `warning`, `danger` | An event's emphasis.                                  |
| `data-date`                     | state     |                                                   | A day cell's date, as `YYYY-MM-DD`.                   |
| `data-today`                    | state     | `true`                                            | Today's cell, and in the week view its column header. |
| `data-outside-month`            | state     | `true`                                            | A day of a neighbouring month in the month view.      |
| `data-all-day`                  | state     | `true`                                            | An all-day event.                                     |
| `data-continues-before`         | state     | `true`                                            | An event that started in an earlier week or day.      |
| `data-continues-after`          | state     | `true`                                            | An event that goes on into a later week or day.       |
| `data-hovered`                  | state     | `true`                                            | Pointer over an event (React Aria).                   |
| `data-pressed`                  | state     | `true`                                            | An event is pressed (React Aria).                     |
| `data-focused`                  | state     | `true`                                            | An event has focus (React Aria).                      |
| `data-focus-visible`            | state     | `true`                                            | An event has keyboard focus (React Aria).             |
