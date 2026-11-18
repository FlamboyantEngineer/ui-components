# Event Timeline

`EventTimeline` shows read-only events on a numeric elapsed-time axis, such as the steps of a recorded run measured from its start: each event is a marker at one elapsed time or a short interval from it. Times and durations are plain numbers in the caller's unit, and the caller's formatter writes them; the axis may span seconds or fractions of a microsecond. Each event is a focusable button that shows its details, events that coincide or overlap take separate lanes, and a companion table lists the same values. Positions are proportions of the axis, set as functional inline styles; the host stylesheet draws everything else.

## UIC-EVENT-TIMELINE-1 - Axis and events

### UIC-EVENT-TIMELINE-1.1 - Parts

`EventTimeline` shall render a `ui-event-timeline` root holding, in order, its visible `label` in a `ui-event-timeline__label` slot when one is given, the `ui-event-timeline__plot` holding one `ui-event-timeline__event` button per drawn event, the `ui-event-timeline__axis`, the current event's `ui-event-timeline__details` (UIC-EVENT-TIMELINE-2.2) and, with `showTable`, the companion table (UIC-EVENT-TIMELINE-3.1). Each event button holds its `label` in a `ui-event-timeline__event-label` slot. A `label` that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no label slot.

Implementation: `src/components/event-timeline/event-timeline.tsx`, `src/components/event-timeline/event-timeline-plot.tsx`, `labs/reference/event-timeline.css`
Verification: `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

### UIC-EVENT-TIMELINE-1.2 - Events

Each event in `events` (`{ id, label, at, duration, tone, details }`) shall be read as given, in the caller's unit: `at` is where it starts and a finite, positive `duration` makes it an interval (`data-kind="interval"`), while a missing, zero, negative or non-finite one makes it a marker (`data-kind="marker"`). An event whose `at` is not a finite number is unreadable: it is neither drawn nor listed. Events are drawn, focused and listed in time order, events of equal `at` in their given order. Each event publishes its `tone` as `data-tone` (`neutral` by default). Numeric and text ids of one spelling (`1` and `'1'`) identify distinct events.

Implementation: `src/components/event-timeline/event-timeline-layout.ts`, `src/components/event-timeline/event-timeline-plot.tsx`
Verification: `src/components/event-timeline/event-timeline-layout.test.ts`, `src/components/event-timeline/event-timeline.test.tsx`

### UIC-EVENT-TIMELINE-1.3 - Range and exact positions

The axis shall span `range` (`{ start, end }`) when both ends are finite and `end` is after `start`; otherwise it spans the readable events' first start to their last end, widened to round values of the tick step (`0` to `1` with no events). Each drawn event's offset from the axis's start edge is set inline as the exact proportion of the range at which it starts (`left`, or `right` when the provider locale reads right to left), and an interval's inline `width` is the exact proportion its duration covers, so microsecond and sub-microsecond durations keep their proportions on any axis width. An event wholly before or after the range is not drawn and takes no tab stop, though the table lists it; an interval that crosses an end is cut at it and publishes `data-clipped` (`start`, `end` or `both`).

Implementation: `src/components/event-timeline/event-timeline-layout.ts`, `src/components/event-timeline/event-timeline-plot.tsx`
Verification: `src/components/event-timeline/event-timeline-layout.test.ts`, `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

### UIC-EVENT-TIMELINE-1.4 - Coincident events

Events that coincide or overlap shall never share a lane: in time order, each drawn event takes the first lane whose last event ends, with the room kept after it, before it starts, so two markers at one time, or an interval and a marker inside it, take separate lanes, and an event that starts exactly where another ends takes another lane too. The room is `eventSpacing`, a share of the range from 0 to 1 (0.15 by default, clamped, a non-finite value read as 0), so the labels the stylesheet draws after events have space. Each event publishes its lane, counted from 0, as the unitless `--ui-event-lane` property, and the root publishes the number of lanes (at least 1) as `--ui-event-timeline-lanes`, from which the stylesheet sets each event's height and the plot's.

Implementation: `src/components/event-timeline/event-timeline-layout.ts`, `src/components/event-timeline/event-timeline-plot.tsx`, `src/components/event-timeline/event-timeline.tsx`, `labs/reference/event-timeline.css`
Verification: `src/components/event-timeline/event-timeline-layout.test.ts`, `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

### UIC-EVENT-TIMELINE-1.5 - Axis, units and formatters

The axis, hidden from assistive technology, shall hold a `ui-event-timeline__tick` per round value of the range (the linear scale's ticks, [UIC-SCALES-1.3](SCALES.md#uic-scales-13---ticks)), offset from the start edge as the events are, each with its value in a `ui-event-timeline__tick-label`, written by `formatAxisValue` when given and otherwise for the provider locale with the tick step's decimals; then `unit`, when given, in a `ui-event-timeline__unit` slot. Every start and duration (in the event descriptions, the details and the table) shall be written by `formatValue` when given, called with the value as given; otherwise as the provider locale's number with up to 15 significant digits followed by a no-break space and `unit`, when given (`0.0000025 s`).

Implementation: `src/components/event-timeline/event-timeline.tsx`, `src/components/event-timeline/event-timeline-plot.tsx`, `src/components/event-timeline/event-timeline-layout.ts`
Verification: `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

### UIC-EVENT-TIMELINE-1.6 - No events

With no drawn event, the root shall publish `data-empty` and the plot shall be replaced by the provider's `noData` string in a `ui-event-timeline__empty` slot; the axis still shows the range.

Implementation: `src/components/event-timeline/event-timeline.tsx`
Verification: `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

### UIC-EVENT-TIMELINE-1.7 - Hooks and caller attributes

`EventTimeline` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/event-timeline/event-timeline.tsx`
Verification: `src/components/event-timeline/event-timeline.test.tsx`

## UIC-EVENT-TIMELINE-2 - Focus and details

### UIC-EVENT-TIMELINE-2.1 - Named group and focusable events

The root shall be a group (`role="group"`) named by its visible `label`, or by `aria-label` or `aria-labelledby`, which take precedence. Each drawn event is a button named by its `label` and described by its time: the provider's `eventTimelineAt` string from its formatted start for a marker, `eventTimelineInterval` from its formatted start and duration for an interval. The events take one tab stop, on the current event when it is drawn and otherwise on the first; the left and right arrow keys (swapped when the locale reads right to left) move focus to the previous and next event in time order, stopping at the ends, and Home and End move to the first and last. Arrow keys with a modifier pass by.

Implementation: `src/components/event-timeline/event-timeline-plot.tsx`, `src/core/strings/timeline.ts`
Verification: `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

### UIC-EVENT-TIMELINE-2.2 - Current event and details

Focusing or pressing an event shall make it the current event, controlled with `currentKey` and `onCurrentKeyChange` or uncontrolled from `defaultCurrentKey` (none by default). The current event publishes `data-current` and `aria-current`, and the details show it: its label in `ui-event-timeline__details-label`, a `ui-event-timeline__details-list` description list with its start under the provider's `timelineStartColumn` and, for an interval, its duration under `timelineDurationColumn`, and its `details`, when they render something, in a `ui-event-timeline__details-body` that also describes its button. A current key that names no readable event shows no details; a current event outside the range keeps its details. The details follow the events, so a changed data window updates or removes them.

Implementation: `src/components/event-timeline/event-timeline.tsx`, `src/components/event-timeline/event-timeline-details.tsx`, `src/components/event-timeline/event-timeline-plot.tsx`
Verification: `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

## UIC-EVENT-TIMELINE-3 - Companion table

### UIC-EVENT-TIMELINE-3.1 - Same values as the axis

With `showTable`, the timeline shall render a [Prose Table](PROSE-TABLE.md) carrying `ui-event-timeline__table`, named as the timeline is, with one row per readable event in time order, drawn or not: the event's label as the row header under the provider's `eventTimelineEventColumn`, its start under `timelineStartColumn` and its duration under `timelineDurationColumn` (empty for a marker), written by the same formatter as the descriptions and the details. With no readable event there is no table.

Implementation: `src/components/event-timeline/event-timeline-details.tsx`, `src/components/event-timeline/event-timeline.tsx`
Verification: `src/components/event-timeline/event-timeline.test.tsx`, `e2e/event-timeline.spec.ts`

## Hooks

| Hook                               | Kind      | Values                                            | Description                                                     |
| ---------------------------------- | --------- | ------------------------------------------------- | --------------------------------------------------------------- |
| `ui-event-timeline`                | root      |                                                   | The group (`role="group"`).                                     |
| `ui-event-timeline__label`         | slot      |                                                   | The visible label, when `label` is set.                         |
| `ui-event-timeline__plot`          | slot      |                                                   | The drawn events, in time order.                                |
| `ui-event-timeline__event`         | slot      |                                                   | One event's button; inline offset, and `width` for an interval. |
| `ui-event-timeline__event-label`   | slot      |                                                   | The event's label inside its button.                            |
| `ui-event-timeline__axis`          | slot      |                                                   | The decorative axis.                                            |
| `ui-event-timeline__tick`          | slot      |                                                   | One round value on the axis; inline offset.                     |
| `ui-event-timeline__tick-label`    | slot      |                                                   | The tick's value.                                               |
| `ui-event-timeline__unit`          | slot      |                                                   | The unit after the axis, when `unit` is set.                    |
| `ui-event-timeline__empty`         | slot      |                                                   | The no-data message, in place of the plot.                      |
| `ui-event-timeline__details`       | slot      |                                                   | The current event's details.                                    |
| `ui-event-timeline__details-label` | slot      |                                                   | The current event's label.                                      |
| `ui-event-timeline__details-list`  | slot      |                                                   | The current event's start and duration.                         |
| `ui-event-timeline__details-body`  | slot      |                                                   | The current event's caller details.                             |
| `ui-event-timeline__table`         | slot      |                                                   | The companion table, with `showTable`.                          |
| `data-empty`                       | state     | `true`                                            | No event is drawn, on the root.                                 |
| `data-kind`                        | state     | `marker`, `interval`                              | Whether an event has a duration.                                |
| `data-tone`                        | attribute | `neutral`, `info`, `success`, `warning`, `danger` | The event's tone.                                               |
| `data-current`                     | state     | `true`                                            | The current event.                                              |
| `data-clipped`                     | state     | `start`, `end`, `both`                            | The ends of an interval the range cuts off.                     |
| `--ui-event-lane`                  | property  |                                                   | The event's lane, counted from 0, unitless.                     |
| `--ui-event-timeline-lanes`        | property  |                                                   | The number of lanes, at least 1, unitless, on the root.         |
