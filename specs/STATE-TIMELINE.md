# State Timeline

`StateTimeline` is a vertical history of the states something went through: each change shows the state it entered in a toned [Badge](BADGE.md), who made it and when through an [Attribution](ATTRIBUTION.md), and an optional comment. The latest change is the current state and is marked; the states still to come can follow it. It is a semantic ordered list with no interaction of its own. The steps of a task in progress are [Steps](STEPS.md).

## UIC-STATE-TIMELINE-1 - Structure

### UIC-STATE-TIMELINE-1.1 - Ordered history

`StateTimeline` shall render an ordered list (`<ol>`, the `ui-state-timeline` root) with one `ui-state-timeline__entry` (`<li>`) per entry of `entries`, then one per state of `upcoming`. Each entry holds a decorative `ui-state-timeline__marker` and a `ui-state-timeline__body` whose `ui-state-timeline__header` starts with the state's `label` in a `status` [Badge](BADGE.md) (`ui-state-timeline__state`) of the entry's `tone` (`neutral` by default), which is not a live region.

Implementation: `src/components/state-timeline/state-timeline.tsx`
Verification: `src/components/state-timeline/state-timeline.test.tsx`, `e2e/state-timeline.spec.ts`

### UIC-STATE-TIMELINE-1.2 - Who and when

An entry with a `time` or a `person` shall show them after the badge as an [Attribution](ATTRIBUTION.md) (`ui-state-timeline__attribution`, the provider's `attribution` sentence), with `showAvatar`, `fallbackAfterDays` and `getNow` passed on to it. An entry with neither, and every upcoming state, shows none.

Implementation: `src/components/state-timeline/state-timeline.tsx`
Verification: `src/components/state-timeline/state-timeline.test.tsx`, `e2e/state-timeline.spec.ts`

### UIC-STATE-TIMELINE-1.3 - Comments

An entry's `comment` shall render in `ui-state-timeline__comment` under its header.

Implementation: `src/components/state-timeline/state-timeline.tsx`
Verification: `src/components/state-timeline/state-timeline.test.tsx`, `e2e/state-timeline.spec.ts`

### UIC-STATE-TIMELINE-1.4 - Current and upcoming states

Each entry shall publish `data-status`: `past` for every change but the last, `current` for the last, and `upcoming` for the states of `upcoming`. The current entry carries `aria-current="step"` and shows the provider's `currentState` text in `ui-state-timeline__current`; each upcoming entry ends its header with the provider's `upcomingState` text, visually hidden.

Implementation: `src/components/state-timeline/state-timeline.tsx`, `src/core/content-strings.ts`
Verification: `src/components/state-timeline/state-timeline.test.tsx`, `e2e/state-timeline.spec.ts`

### UIC-STATE-TIMELINE-1.5 - Direction

`direction` (`ascending` by default, or `descending`) shall publish `data-direction` on the root. `ascending` lists the oldest change first and the upcoming states last; `descending` reverses the whole list, so the furthest upcoming state comes first and the oldest change last.

Implementation: `src/components/state-timeline/state-timeline.tsx`
Verification: `src/components/state-timeline/state-timeline.test.tsx`, `e2e/state-timeline.spec.ts`

### UIC-STATE-TIMELINE-1.6 - Hooks and caller attributes

`StateTimeline` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/state-timeline/state-timeline.tsx`
Verification: `src/components/state-timeline/state-timeline.test.tsx`

## UIC-STATE-TIMELINE-2 - Accessibility

### UIC-STATE-TIMELINE-2.1 - Named list

The list shall be named by `aria-label` or `aria-labelledby`, else by the provider's `stateHistory` string.

Implementation: `src/components/state-timeline/state-timeline.tsx`, `src/core/content-strings.ts`
Verification: `src/components/state-timeline/state-timeline.test.tsx`, `e2e/state-timeline.spec.ts`

### UIC-STATE-TIMELINE-2.2 - Read-only output

A state timeline shall add no tab stop of its own: its only tab stops are those of its attributions' times and of the content of its comments.

Implementation: `src/components/state-timeline/state-timeline.tsx`
Verification: `src/components/state-timeline/state-timeline.test.tsx`

## Hooks

| Hook                             | Kind      | Values                        | Description                                           |
| -------------------------------- | --------- | ----------------------------- | ----------------------------------------------------- |
| `ui-state-timeline`              | root      |                               | The ordered list (`<ol>`).                            |
| `ui-state-timeline__entry`       | slot      |                               | One change or upcoming state (`<li>`).                |
| `ui-state-timeline__marker`      | slot      |                               | The decorative dot on the line.                       |
| `ui-state-timeline__body`        | slot      |                               | The header and comment.                               |
| `ui-state-timeline__header`      | slot      |                               | The state badge, current mark and attribution.        |
| `ui-state-timeline__state`       | slot      |                               | The state's badge (also `ui-badge`).                  |
| `ui-state-timeline__current`     | slot      |                               | The current state's mark.                             |
| `ui-state-timeline__attribution` | slot      |                               | Who made the change and when (also `ui-attribution`). |
| `ui-state-timeline__comment`     | slot      |                               | The note left with the change.                        |
| `data-direction`                 | attribute | `ascending`, `descending`     | Oldest or newest change first.                        |
| `data-status`                    | state     | `past`, `current`, `upcoming` | Where an entry sits (on the entry).                   |
