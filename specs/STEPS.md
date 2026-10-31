# Steps

`Steps` is the ordered list of the steps of a task, such as Upload, Prepare and Import, with where each one stands: complete, current, upcoming, failed or skipped. It is a semantic ordered list with the current step marked by `aria-current="step"`; React Aria has no matching behaviour, so only a pressable step uses its `Button`. Steps already reached can be pressed to return to them. [Wizard](WIZARD.md) frames a task around it; a location trail is a [Breadcrumb](BREADCRUMB.md), and a history of state changes is a [State Timeline](STATE-TIMELINE.md).

## UIC-STEPS-1 - Structure

### UIC-STEPS-1.1 - Ordered list

`Steps` shall render an ordered list (`<ol>`, the `ui-steps` root) with one `ui-steps__item` (`<li>`) per entry of `items`, in order. Each item holds a `ui-steps__step` element with a decorative `ui-steps__marker` and a `ui-steps__text` slot holding the step's `label` in `ui-steps__label`. A decorative `ui-steps__connector` follows every step but the last.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-1.2 - Status

Each item shall publish its status as `data-status`: `complete`, `current`, `upcoming`, `error` or `skipped`. A step's own `status` wins; otherwise steps before `currentId` are `complete`, the step at `currentId` is `current` and the steps after it are `upcoming`, as every step is when `currentId` matches none.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-1.3 - Current step

The item at `currentId` shall carry `aria-current="step"` and `data-current`, whatever its status, so a current step that failed reads as both current and `error`.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-1.4 - Markers

The marker shall show the step's number, formatted for the locale, or a glyph for a settled step: `check` for `complete`, `error` for `error` and `minus` for `skipped`. It is hidden from assistive technology.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`

### UIC-STEPS-1.5 - Descriptions and optional steps

A step's `description` shall render in `ui-steps__description` after its label, and a step with `isOptional` shows the provider's `optional` string in `ui-steps__optional`.

Implementation: `src/components/steps/steps.tsx`, `src/core/strings/common.ts`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-1.6 - Orientation and variant

`orientation` (`horizontal` by default, or `vertical`) and `variant` (`default`, or `compact`) shall publish `data-orientation` and `data-variant` on the root. A `compact` list renders no descriptions or optional marks, and visually hides every label but the current step's, which stay in the list for assistive technology.

Implementation: `src/components/steps/steps.tsx`, `labs/reference/steps.css`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-1.7 - Hooks and caller attributes

`Steps` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`

### UIC-STEPS-1.8 - Narrow containers

The reference stylesheet shall lay a horizontal list out in equal columns, each step's label and description under its marker, so a label wraps between words and never one letter a line. When a column would be narrower than 80px, and always in the `compact` variant, it shall become a rail: the markers and connectors stay in one row, and the current step's text (or, in a complete `compact` list, the completion words) takes a full-width line below; the other steps' text stays in the list for assistive technology, and pressable steps keep their names, keyboard order and disabled state. The list never draws markers, connectors or text over one another, from 240px wide with up to 8 steps; it reads each step's place for lists of up to 12 steps. A vertical list keeps its layout at every width.

Implementation: `labs/reference/steps.css`
Verification: `e2e/steps-narrow.spec.ts`

## UIC-STEPS-2 - Behaviour

### UIC-STEPS-2.1 - Returning to a step

With `onAction`, every step other than the current one whose status is `complete`, `error` or `skipped` shall be a button (the `ui-steps__step`, React Aria's `Button`) in the tab order that calls `onAction` with the step's `id` when pressed with a pointer, Enter or Space. Upcoming and current steps, and every step without `onAction`, stay text.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-2.2 - Disabled steps

A step with `isDisabled`, or every step while the list has `isDisabled`, shall publish `data-disabled` on its item and refuse presses: a step that would be pressable stays a natively disabled button, out of the tab order.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`

### UIC-STEPS-2.3 - Interaction states

Pressable steps shall publish their states: `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` (keyboard focus only) and `data-disabled`.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

## UIC-STEPS-3 - Accessibility

### UIC-STEPS-3.1 - Named list

The list shall be named by `aria-label` or `aria-labelledby`, else by the provider's `steps` string.

Implementation: `src/components/steps/steps.tsx`, `src/core/strings/common.ts`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

### UIC-STEPS-3.2 - Status words

A settled step's label shall end with the provider's `stepStatus` words (`Completed`, `Has errors`, `Skipped`), visually hidden, so the status never rests on the marker alone. A pressable step is named by its content: the label, the status words, the optional mark and the description, so its name holds all of its visible text.

Implementation: `src/components/steps/steps.tsx`, `src/core/strings/common.ts`
Verification: `src/components/steps/steps.test.tsx`, `e2e/steps.spec.ts`

## UIC-STEPS-4 - Unified options

### UIC-STEPS-4.1 - All complete

isComplete shall mark every step complete, with no current step. Compact mode shall show Completed at the last marker; completed steps remain pressable when onAction is supplied.

Implementation: `src/components/steps/steps.tsx`
Verification: `src/components/steps/steps.test.tsx`, `e2e/unified-options.spec.ts`

## Hooks

| Hook                    | Kind      | Values                                                | Description                                                       |
| ----------------------- | --------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui-steps`              | root      |                                                       | The ordered list (`<ol>`).                                        |
| `ui-steps__item`        | slot      |                                                       | One step (`<li>`).                                                |
| `ui-steps__step`        | slot      |                                                       | The step's content: a `<button>` when pressable, else a `<span>`. |
| `ui-steps__marker`      | slot      |                                                       | The decorative number or status glyph.                            |
| `ui-steps__text`        | slot      |                                                       | The label, optional mark and description.                         |
| `ui-steps__label`       | slot      |                                                       | The step's label.                                                 |
| `ui-steps__optional`    | slot      |                                                       | The optional mark.                                                |
| `ui-steps__description` | slot      |                                                       | The line under the label.                                         |
| `ui-steps__connector`   | slot      |                                                       | The decorative line to the next step.                             |
| `data-orientation`      | attribute | `horizontal`, `vertical`                              | How the steps run.                                                |
| `data-variant`          | attribute | `default`, `compact`                                  | Full or compact list.                                             |
| `data-status`           | state     | `complete`, `current`, `upcoming`, `error`, `skipped` | Where a step stands (on the item).                                |
| `data-current`          | state     | `true`                                                | The current step's item.                                          |
| `data-disabled`         | state     | `true`                                                | A step that refuses presses (item and button).                    |
| `data-hovered`          | state     | `true`                                                | Pointer over a pressable step.                                    |
| `data-pressed`          | state     | `true`                                                | A pressable step is being pressed.                                |
| `data-focused`          | state     | `true`                                                | A pressable step is focused.                                      |
| `data-focus-visible`    | state     | `true`                                                | A pressable step has keyboard focus.                              |

| `data-complete` | state | `true` | Every step is complete and no step is current. |
