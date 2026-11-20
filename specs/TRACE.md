# Trace

`Trace` records what an agent did, one line per step, after shadcn/ui's trace parts: a line holds an icon, a title and a description, and a collapsible step shows and hides its details, such as reasoning or a command's output. The parts are presentation only: what a step is, when it runs and when it opens belong to the caller, such as [Chat](CHAT.md)'s activity.

## UIC-TRACE-1 - Lines

### UIC-TRACE-1.1 - Trace and lines

`Trace` shall render a `ui-trace` `<div>` holding its steps in order. `TraceLine` shall render a `ui-trace__line` `<span>` that holds a step's parts and publishes `status` as `data-status` (`running`, `pending` or `error`); a line without `status` is done and publishes none. `TraceIcon` (`ui-trace__icon`) is a `<span>` hidden from assistive technology for a decorative glyph or spinner; `TraceTitle` (`ui-trace__title`) and `TraceDescription` (`ui-trace__description`) are `<span>` elements for what the step did and a detail after it, such as its duration. Every part forwards its native attributes and keeps the caller's markup, so a line may sit inside a link or a button; the caller puts a space between a title and its description, so a name read from the line keeps them apart. The reference stylesheet draws lines in muted text, a failed line in the danger tone, a pending one with its icon faded, and a running one's title in the text color, so the step under way stands out.

Implementation: `src/components/trace/trace.tsx`, `labs/reference/trace.css`
Verification: `src/components/trace/trace.test.tsx`, `e2e/trace.spec.ts`

## UIC-TRACE-2 - Collapsible steps

### UIC-TRACE-2.1 - Collapsible, trigger and content

`TraceCollapsible` shall render a [Collapsible](DISCLOSURE.md#uic-disclosure-51---collapsible-and-accordion-parts) with the `ui-trace__collapsible` class, taking its `isExpanded`, `defaultExpanded`, `onExpandedChange` and `isDisabled`. `TraceCollapsibleTrigger` shall render its trigger button with the `ui-trace__collapsible-trigger` class, holding the caller's line and then a decorative `ui-trace__collapsible-indicator` chevron that points to the inline end while collapsed and down while expanded. `TraceCollapsibleContent` shall render its panel with the `ui-trace__collapsible-content` class, which stays mounted while hidden and is named by the trigger, and takes Collapsible content's `render` (such as to set `aria-busy` or focus handlers on the panel itself). The reference stylesheet sets the content under a rule along its start edge, in muted text.

Implementation: `src/components/trace/trace.tsx`, `labs/reference/trace.css`
Verification: `src/components/trace/trace.test.tsx`, `e2e/trace.spec.ts`

## Hooks

| Hook                              | Kind      | Values                        | Description                       |
| --------------------------------- | --------- | ----------------------------- | --------------------------------- |
| `ui-trace`                        | root      |                               | The steps, in order.              |
| `ui-trace__line`                  | slot      |                               | One step's icon, title and more.  |
| `ui-trace__icon`                  | slot      |                               | Decorative glyph or spinner.      |
| `ui-trace__title`                 | slot      |                               | What the step did.                |
| `ui-trace__description`           | slot      |                               | A detail, such as a duration.     |
| `ui-trace__collapsible`           | slot      |                               | A step with details.              |
| `ui-trace__collapsible-trigger`   | slot      |                               | The button showing the details.   |
| `ui-trace__collapsible-indicator` | slot      |                               | The trigger's decorative chevron. |
| `ui-trace__collapsible-content`   | slot      |                               | The step's details.               |
| `data-status`                     | attribute | `running`, `pending`, `error` | The line's progress.              |
