# Calendar View

`CalendarView` shows events on a calendar, in a month view or a week view: due dates, reviews, releases, meetings. Events are plain data on ISO 8601 dates (all-day) or date-times (timed), placed on days and hours in a time zone. A toolbar moves by month or week, back to today and between the views; the grid of days is navigated by keyboard like a date picker's calendar, but each day holds its events, a crowded month day lists the rest behind `+n more`, and the week view places timed events on a time grid with [time scales](SCALES.md). For picking a date, use [Date Time Field](DATE-TIME-FIELD.md).

## UIC-CALENDAR-VIEW-1 - Views and navigation

### UIC-CALENDAR-VIEW-1.1 - Month view

In the month view (`view="month"`, the default) the calendar shall render a grid (`ui-calendar-view__grid`) whose first row (`ui-calendar-view__weekdays`) holds a column header per weekday (`ui-calendar-view__weekday`), from the locale's first day of the week, showing the short name and named by the full name (visually hidden text), followed by one row (`ui-calendar-view__week`) per week that shows part of the focused day's month. Each day is a cell (`ui-calendar-view__day`) publishing its date as `data-date`, showing its day of the month (`ui-calendar-view__day-number`) and its events (`ui-calendar-view__events`); days of the neighbouring months publish `data-outside-month`.

Implementation: `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-day.tsx`, `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-view-focus.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `e2e/calendar-view.spec.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-1.2 - Week view

In the week view (`view="week"`) the grid's first row shall hold a column header per day of the focused day's week, showing its short weekday name and its day of the month (`ui-calendar-view__day-number`) and named by the day in full, followed by one row of day cells, each holding an all-day area (`ui-calendar-view__all-day`) for bars and a time grid (`ui-calendar-view__timed`) for timed events. A decorative gutter (`ui-calendar-view__gutter`) leads both rows; in the day row it shows the provider's `allDay` string beside the all-day areas and the hours of the day (`ui-calendar-view__hour`) beside the time grids, each placed at its share of the day.

Implementation: `src/components/calendar-view/calendar-week.tsx`, `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `e2e/calendar-view.spec.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-1.3 - Toolbar

A toolbar (`ui-calendar-view__toolbar`) shall precede the grid with a [Button](BUTTON.md) reading the provider's `today` string that moves the focused day to today (`ui-calendar-view__today`), previous and next [icon-only buttons](BUTTON.md) named by the provider's `previousRange` and `nextRange` strings for the view's unit that move it by a month or a week (`ui-calendar-view__previous`, `ui-calendar-view__next`, their chevrons mirrored right to left), the period on show (`ui-calendar-view__title`: the month and year, or the week's date range), which names the grid and is a polite live region, and a [SegmentedChoice](SEGMENTED-CHOICE.md) between the `views` (`ui-calendar-view__views`, named by the provider's `calendarViews` string, its options the `month` and `week` strings). `views` lists the allowed views; repeats are ignored and an empty list allows both. With one allowed view the choice is not shown. The view is controlled with `view` and `onViewChange` or uncontrolled from `defaultView` (`month` by default); a view, controlled or chosen, that is not allowed draws instead the default view when it is allowed, else the first allowed view, without calling `onViewChange`, and shows again once it is allowed again; the focused day (`YYYY-MM-DD`) with `date` and `onDateChange` or uncontrolled from `defaultDate`, today by default. The root publishes the view as `data-view`.

Implementation: `src/components/calendar-view/calendar-view.tsx`, `src/core/strings/planning.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-view-modes.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-1.4 - Today

`getNow` (the provider's clock by default, else the current time) shall decide today in the view's time zone (`timeZone`, else the provider's, else the browser's). A server render and its hydration never read the clock ([UIC-PROVIDER-8.2](PROVIDER.md)): they mark no day as today, and without `date` or `defaultDate` they draw only the busy (`aria-busy`) root, which fills in on the first client render. The Today button reads the clock when pressed. Today's cell carries `aria-current="date"` and `data-today`, and in the week view today's column header publishes `data-today` too.

Implementation: `src/components/calendar-view/calendar-view.tsx`, `src/components/calendar-view/calendar-day.tsx`, `src/components/calendar-view/calendar-week.tsx`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-1.5 - Time zone and locale

Events shall be placed on days and hours in `timeZone` (the runtime's by default): a date-time with an offset or a zone converts to it, and a floating one reads as wall time in it. The first day of the week, the names of days and months, times and date ranges follow the provider's locale. Every formatted date, time and range writes its spaces as plain spaces (`normalizeIntlSpaces`), so text a server renders hydrates unchanged in a browser whose `Intl` sets thin or narrow no-break spaces differently.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/use-calendar-format.ts`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-view-ssr.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-1.6 - Planning range

The calendar shall support the days from `0002-01-01` to `9998-12-31`, a year inside each end of the ISO 8601 calendar, so every day of a week or month around a supported day is a real date. A `date` or `defaultDate` outside that range shows its nearer end, and moving past an end by the toolbar or the keyboard keeps the focused day at the end without calling `onDateChange`. Every week shows seven distinct days with one tab stop.

Implementation: `src/utils/planning-dates.ts`, `src/components/calendar-view/calendar-view.tsx`
Verification: `src/utils/planning-dates.test.ts`, `src/components/calendar-view/calendar-view-planning-range.test.tsx`, `e2e/calendar-view.spec.ts`

## UIC-CALENDAR-VIEW-2 - Events

### UIC-CALENDAR-VIEW-2.1 - Event data

Each event shall have an `id`, a `title` and a `start`, and may be marked `isReadOnly` (UIC-CALENDAR-VIEW-5.1): a `YYYY-MM-DD` date makes it an all-day event, an ISO 8601 date-time a timed one. `end` is the last day of an all-day event, inclusive, or the end of a timed event, exclusive; without it an all-day event lasts its start day and a timed event an hour. An end before the start is read as the start. Events whose start is neither are left out. Numeric and text IDs with the same spelling identify distinct events, retaining their rendered identity and callback keys when reordered in the week view or a crowded-day list. `tone` (`neutral` by default) is published as `data-tone`.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`

### UIC-CALENDAR-VIEW-2.2 - Event buttons

Each event shall render a button (`ui-calendar-view__event`) named by the provider's `calendarEvent` string with its title and when it happens (its day or days, or its times), in visually hidden text that stands in for the visible parts, showing its title (`ui-calendar-view__event-title`) after its start time in the month view or its time range in the week view (`ui-calendar-view__event-time`; all-day events show no time). All-day events publish `data-all-day`. A press, Enter or Space calls `onEventAction` with the event's `id`, then, while the event is editable, opens the event editor (UIC-CALENDAR-VIEW-5.2); a read-only event only calls it. An event's button belongs to its `id` (numeric and text ids stay distinct), not to its lane: when events are added, removed or changed and the lanes are packed again, a focused event keeps its button and focus, so Enter or Space still reports its own `id`. A focused event that leaves the view (removed, or hidden behind a crowded day's more button) hands focus to its day cell; its button is never reused for another event.

Implementation: `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-2.3 - Bars across days

All-day events, and timed events lasting at least one wall-clock day in `timeZone` (their end at or after their start's time on the next day, so midnight to midnight is a bar also on a day the clocks change and it lasts 23 or 25 hours), shall be drawn as bars across the days they cover in each week: a bar renders in the cell of its first day in the week with an inline width of its number of days times 100%, publishing `data-continues-before` when the event started in an earlier week and `data-continues-after` when it goes on into a later one. Each week packs its events into lanes, each taking the first lane free across its days: bars first, then by start day, longer bars first, then by start time. Where a day's lane is taken by a bar from an earlier day, or empty below a used lane, the cell holds a decorative spacer (`ui-calendar-view__spacer`), so lanes line up across the week. In the month view a week's lanes hold all its events; in the week view they hold the bars, padded to the same count on every day.

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-week.tsx`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-2.4 - Crowded days

A month cell shall show at most `maxEvents` rows (3 by default). When a day of the week covers more events than that, the week shows one lane fewer, and each day with hidden events ends with a [Button](BUTTON.md) (`ui-calendar-view__more`) reading the provider's `moreEvents` string with the count hidden there (`+2 more`), which opens a [Popover](POPOVER.md) titled by the day in full listing all of the day's events (`ui-calendar-view__more-list`).

Implementation: `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-month.tsx`, `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-layout.test.ts`, `src/components/calendar-view/calendar-view.test.tsx`, `e2e/calendar-view.spec.ts`

### UIC-CALENDAR-VIEW-2.5 - Time grid

In the week view, timed events shorter than 24 hours shall be placed in the time grid of each day they touch, clipped to the day, with an inline absolute `top` and `height` in percent of the day. Every day shares one 24-hour wall-clock ruler, the gutter's hour labels at `hour / 24`: an instant sits at its wall-clock time of day in `timeZone`, so an event lines up with its hour label and with the same time on any other day, including days whose clocks change. A skipped hour (clocks going forward) stays on the ruler, empty, and an event across it spans it from its start to its end time. Both passes of a repeated hour (clocks going back) share its place, so their events overlap and sit side by side; an event whose end reads earlier than its start, running back through the repeated hour, keeps its elapsed length from its start. Events in a repeated hour keep their distinction in their times, which name the offset of each end (`1:30 AM EDT – 1:45 AM EDT`). Offsets that change by other amounts, such as half an hour, follow the same rules. Each event is drawn over at least `minEventMinutes` of the ruler (30 by default), short of the day's end, so a short or zero-duration event stays large enough to read and press; a host sizes its ruler so that length is a comfortable target, and `0` draws events at their exact lengths. Overlapping events, by what is drawn, share the day's width side by side, packed from the inline start in the order they are drawn on the ruler (by top, then the taller first, then by start instant), so no event covers another and events in either pass of a repeated hour never land in a lane already drawn over them, each with an inline `width` and an offset from the inline start in percent: `left`, or `right` right to left. An event clipped at the start or end of the day publishes `data-continues-before` or `data-continues-after`.

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

The grid shall be one tab stop, the focused day's cell. On a day cell ArrowLeft and ArrowRight move a day (mirrored right to left), ArrowUp and ArrowDown a week, Home and End to the first and last day of the week, and PageUp and PageDown a month in the month view or a week in the week view, always from the day of the cell that has focus, including a day of a neighbouring month; moving to a day of another month or week shows it, and focus follows to its cell. A move the owner of a controlled `date` does not apply leaves focus where it is, and a later change of `date` never takes focus, even to the day the move asked for: focus follows a move only when the owner applies it before the next task, and only while focus is still in the grid (or was lost with the cell the move left). Only the focused day's events and `+n more` button are in the Tab sequence. Focus landing in a day of the period on show by other means makes it the focused day.

Implementation: `src/components/calendar-view/use-calendar-grid.ts`, `src/components/calendar-view/calendar-layout.ts`, `src/components/calendar-view/calendar-day.tsx`, `src/components/calendar-view/calendar-days.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`, `src/components/calendar-view/calendar-layout.test.ts`, `e2e/calendar-view.spec.ts`, `src/components/calendar-view/calendar-days.test.ts`

### UIC-CALENDAR-VIEW-4.3 - Hooks and caller attributes

`CalendarView` shall carry the hooks below, append the caller's `className` to the root, and forward `id`, `ref` and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/calendar-view/calendar-view.tsx`, `src/components/calendar-view/calendar-view-hooks.ts`
Verification: `src/components/calendar-view/calendar-view.test.tsx`

## UIC-CALENDAR-VIEW-5 - Event menus and editing

### UIC-CALENDAR-VIEW-5.1 - Event menus

Each event button shall be a context menu target (`ContextMenu`): a secondary click or long touch on the event opens its menu at the pointer, and the Context Menu key or Shift+F10 on the focused event below it, in the month and week views and in a crowded day's `+n more` list. The menu, named by the provider's `eventActions` string with the event's title, lists `eventMenu`, `['edit']` by default, or what a function of the event returns: `'edit'` adds the built-in Edit (the provider's `edit` string) only while the event is editable, and any other menu entry shows as given. With no entry left the event keeps the browser's menu. Choosing Edit opens the event editor; every chosen entry, Edit included, then calls `onEventMenuAction` with its key and the event. A menu whose event leaves the view closes with its button; one whose entries all go closes. The day keys still reach the grid from an event. Edit has no icon by default; `eventMenuIcons` gives it one as `edit` ([UIC-MENU-6.1](MENU.md#uic-menu-61---action-icon-maps)), and the host's entries take their own `icon`.

An event is editable while the reader may `edit` it (UIC-CALENDAR-VIEW-6.1).

Implementation: `src/components/calendar-view/calendar-event-menu.tsx`, `src/components/calendar-view/calendar-event.tsx`, `src/components/calendar-view/calendar-view.tsx`
Verification: `src/components/calendar-view/calendar-event-menu.test.tsx`, `e2e/calendar-view-editing.spec.ts`

### UIC-CALENDAR-VIEW-5.2 - Event editor

Edit, or a single press of an editable event (its click, Enter or Space, in every view and in a crowded day's list), shall open a modal (`Modal`, `ui-calendar-view__editor`) titled by the provider's `editEvent` string, holding the event's title (a required `TextField`), an all-day `Checkbox` and its start and end (a required `DateTimeField`: a `date-range` for an all-day event, a `date-time-range` in the calendar's `timeZone` for a timed one, an hour after the start when it has no end). Ticking all-day keeps the days the range covers; unticking it gives those days 09:00 and 10:00. Save is disabled while the title is blank or the range is incomplete or ends before it starts; it calls `onEventChange` with the event with the trimmed title, the all-day state and the range, and the event as it was, then closes. A timed event keeps its start's form: a wall-clock start stays a wall-clock text in the calendar's zone, a start with an offset or zone takes the editor's zoned text. When the saved event starts on another day, that day becomes the focused day. Cancel, the close button and Escape close without calling it; focus stays inside the dialog while it is open. The host owns the events: the calendar shows the change once `events` holds it.

The editor follows its event by `id`: fields the reader has not changed show the host's latest values, and changed fields keep the reader's draft. It closes, without calling `onEventChange`, when the event leaves `events` or stops being editable. On closing, focus returns to the event's button, else to the focused day's cell.

Implementation: `src/components/calendar-view/calendar-event-editor.tsx`, `src/components/calendar-view/calendar-event-range.ts`
Verification: `src/components/calendar-view/calendar-event-menu.test.tsx`, `src/components/calendar-view/calendar-event-range.test.ts`, `e2e/calendar-view-editing.spec.ts`

## UIC-CALENDAR-VIEW-6 - Moving and resizing events

### UIC-CALENDAR-VIEW-6.1 - Drag modes

The reader may change an event while `onEventChange` is given, the event is not `isReadOnly`, and `canChangeEvent`, when given, allows the change (`edit`, `move`, or `resize` for either end); the editor (UIC-CALENDAR-VIEW-5) asks for `edit`. `eventDragMode` chooses what dragging does, and no handle is drawn in either mode:

- `move` (the default): the event's button itself drags to move the event (`data-movable`), and its end edge changes its end.
- `resize`: its start edge changes its start and its end edge its end; the event itself does not move.

| `ui-calendar-view__event-frame` | slot | | An event with start or end edges, and its edges. |

Implementation: `src/components/calendar-view/calendar-event-handles.tsx`, `src/components/calendar-view/calendar-event.tsx`, `src/components/calendar-view/use-event-changes.ts`
Verification: `src/components/calendar-view/calendar-event-handles.test.tsx`, `e2e/calendar-view-dragging.spec.ts`

### UIC-CALENDAR-VIEW-6.2 - Pointer drags

A press with the primary pointer becomes a drag once it travels 4 pixels; the drag then follows the day under the pointer and, on the week's time grid, its minute, snapped to 15 minutes from where it began. A move shifts the whole event, every part of it, by those days and wall-clock minutes and keeps its elapsed length; a start or end drag shifts that end only, never past the other: an all-day event keeps at least its one day, a timed event 15 minutes, and an event without an end is given one when its start moves. A bar changes by whole days. Once a press becomes a drag, every drawn part of the event, whether its body or either edge is dragged, publishes `data-dragging` as a ghost of where it stands, and so does the dragged edge; a preview of the event where it would land is drawn apart from it (`ui-calendar-view__event` with `data-preview`, hidden from assistive technology). The preview is packed with nothing: on a time grid it covers its day's width from the inline start, and a bar's preview is drawn over the first lane, both over the other events, so neither the dragged event nor any other moves while the pointer is held; the events are packed as usual (UIC-CALENDAR-VIEW-2.3, UIC-CALENDAR-VIEW-2.5) once the host takes the change, and as they were when the drag is abandoned or the host keeps the event. The ghost clears when the drag ends, whether released or abandoned. Releasing calls `onEventChange` once with the changed event and the event as it was, unless nothing changed, and the release is not a click: it neither opens the editor nor calls `onEventAction`. A press that never became a drag is a click (UIC-CALENDAR-VIEW-2.2), and a secondary press opens the event's menu. Escape, a cancelled or lost pointer, a change of the event by the host, or the event or edge leaving (as when the event stops being changeable) abandons the drag without calling it. Times are written in the form of the event's start (UIC-CALENDAR-VIEW-5.2), and a move keeps the wall-clock start across a change of the clocks.

Implementation: `src/components/calendar-view/calendar-event-handles.tsx`, `src/components/calendar-view/calendar-event-change.ts`
Verification: `src/components/calendar-view/calendar-event-change.test.ts`, `e2e/calendar-view-dragging.spec.ts`

### UIC-CALENDAR-VIEW-6.3 - Keyboard

On a focused movable event (the `move` mode) or a focused edge, ArrowLeft and ArrowRight shall shift the event, or that end, a day, mirrored right to left, and ArrowUp and ArrowDown 15 minutes on the week's time grid or a week on a bar, calling `onEventChange` for each step. The event's new start day becomes the focused day, and focus stays on the same event or edge wherever it is drawn again. Edges show the focus ring while focused.

Implementation: `src/components/calendar-view/calendar-event-handles.tsx`, `src/components/calendar-view/calendar-event.tsx`
Verification: `src/components/calendar-view/calendar-event-handles.test.tsx`, `e2e/calendar-view-dragging.spec.ts`

## Hooks

| Hook                            | Kind      | Values                                            | Description                                                                             |
| ------------------------------- | --------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ui-calendar-view`              | root      |                                                   | The calendar.                                                                           |
| `ui-calendar-view__toolbar`     | slot      |                                                   | The navigation and view controls.                                                       |
| `ui-calendar-view__today`       | slot      |                                                   | The Today button (also `ui-button`).                                                    |
| `ui-calendar-view__previous`    | slot      |                                                   | The previous month or week button (also `ui-button`).                                   |
| `ui-calendar-view__next`        | slot      |                                                   | The next month or week button (also `ui-button`).                                       |
| `ui-calendar-view__title`       | slot      |                                                   | The period on show.                                                                     |
| `ui-calendar-view__views`       | slot      |                                                   | The choice of view (also `ui-segmented-choice`).                                        |
| `ui-calendar-view__grid`        | slot      |                                                   | The grid of days (`role="grid"`).                                                       |
| `ui-calendar-view__weekdays`    | slot      |                                                   | The row of column headers.                                                              |
| `ui-calendar-view__weekday`     | slot      |                                                   | A column header.                                                                        |
| `ui-calendar-view__week`        | slot      |                                                   | A row of days.                                                                          |
| `ui-calendar-view__gutter`      | slot      |                                                   | The week view's leading column of labels.                                               |
| `ui-calendar-view__hour`        | slot      |                                                   | An hour label of the time grid.                                                         |
| `ui-calendar-view__day`         | slot      |                                                   | A day cell (`role="gridcell"`).                                                         |
| `ui-calendar-view__day-number`  | slot      |                                                   | The day of the month.                                                                   |
| `ui-calendar-view__day-content` | slot      |                                                   | The caller's `renderDay` content.                                                       |
| `ui-calendar-view__events`      | slot      |                                                   | A month cell's events.                                                                  |
| `ui-calendar-view__all-day`     | slot      |                                                   | A week day's bars, and the gutter's all-day label.                                      |
| `ui-calendar-view__timed`       | slot      |                                                   | A week day's time grid, and the gutter's hours.                                         |
| `ui-calendar-view__event`       | slot      |                                                   | An event button.                                                                        |
| `ui-calendar-view__event-time`  | slot      |                                                   | An event's start time or time range.                                                    |
| `ui-calendar-view__event-title` | slot      |                                                   | An event's title.                                                                       |
| `ui-calendar-view__spacer`      | slot      |                                                   | An empty or taken lane of a day.                                                        |
| `ui-calendar-view__more`        | slot      |                                                   | A crowded day's `+n more` button (also `ui-button`).                                    |
| `ui-calendar-view__more-list`   | slot      |                                                   | The events listed in the `+n more` popover.                                             |
| `ui-calendar-view__editor`      | slot      |                                                   | The event editor (also `ui-modal`).                                                     |
| `ui-calendar-view__event-frame` | slot      |                                                   | An event with start or end edges, and its edges.                                        |
| `ui-calendar-view__event-start` | slot      |                                                   | An event's start edge, an invisible drag target.                                        |
| `ui-calendar-view__event-end`   | slot      |                                                   | An event's end edge, an invisible drag target.                                          |
| `data-view`                     | attribute | `month`, `week`                                   | The view on show.                                                                       |
| `data-tone`                     | attribute | `neutral`, `info`, `success`, `warning`, `danger` | An event's emphasis.                                                                    |
| `data-date`                     | state     |                                                   | A day cell's date, as `YYYY-MM-DD`.                                                     |
| `data-today`                    | state     | `true`                                            | Today's cell, and in the week view its column header.                                   |
| `data-outside-month`            | state     | `true`                                            | A day of a neighbouring month in the month view.                                        |
| `data-all-day`                  | state     | `true`                                            | An all-day event.                                                                       |
| `data-continues-before`         | state     | `true`                                            | An event that started in an earlier week or day.                                        |
| `data-continues-after`          | state     | `true`                                            | An event that goes on into a later week or day.                                         |
| `data-preview`                  | state     | `true`                                            | Where a dragged event would land.                                                       |
| `data-dragging`                 | state     | `true`                                            | Every part of an event being dragged, by its body or either edge, and the dragged edge. |
| `data-movable`                  | state     | `true`                                            | An event that drags to move.                                                            |
| `data-hovered`                  | state     | `true`                                            | Pointer over an event (React Aria).                                                     |
| `data-pressed`                  | state     | `true`                                            | An event is pressed (React Aria).                                                       |
| `data-focused`                  | state     | `true`                                            | An event has focus (React Aria).                                                        |
| `data-focus-visible`            | state     | `true`                                            | An event has keyboard focus (React Aria).                                               |
