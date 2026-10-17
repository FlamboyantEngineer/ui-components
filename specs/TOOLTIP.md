# Tooltip

`Tooltip` shows a short, non-interactive hint for a control, built on React Aria's `TooltipTrigger` and `Tooltip`. It opens when its trigger is hovered or keyboard focused and closes when the reader moves on. Content the reader acts on belongs in a popover or menu, never in a tooltip. Text cut short by its box uses [Truncation Tooltip](TRUNCATION-TOOLTIP.md), which shares this panel's hooks.

## UIC-TOOLTIP-1 - Contract

### UIC-TOOLTIP-1.1 - Trigger and panel

`Tooltip` shall wrap one trigger that is a React Aria focusable (`Button`, `IconButton`, `Link` or an element wrapped in `Focusable`) and render its `content` in the `ui-tooltip__content` slot of a panel with `role="tooltip"`, portalled to the end of the document. The panel never takes focus, holds no interactive content and adds no wrapper element around the trigger.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.2 - Opening

Hovering the trigger with a mouse or pen shall open the panel after `delay` milliseconds (500 by default); keyboard focus shall open it at once. Right after one tooltip closes, a neighbouring trigger opens its tooltip without the delay, and only one tooltip is open at a time. Touch never opens it. `trigger="focus"` opens it on keyboard focus only and `isDisabled` never opens it.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.3 - Closing

The panel shall close when the pointer leaves the trigger (after `closeDelay`, 500 milliseconds by default, so the reader can move onto the hint), when the trigger loses focus, when it is pressed (unless `shouldCloseOnPress` is false) and when Escape is pressed. Escape keeps focus on the trigger, and a pending hover opening is cancelled when the pointer leaves.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.4 - Description

While the panel is open, the trigger shall be described by it through `aria-describedby`, and the reference shall be removed when it closes. The trigger keeps its own accessible name. A trigger that sets its own `aria-describedby` keeps that value instead (React Aria gives the trigger's props precedence).

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.5 - Placement

`placement` (`top` by default, or any React Aria placement such as `bottom`, `start` or `end top`) shall choose the preferred side; the panel flips to the opposite side when it does not fit (unless `shouldFlip` is false) and stays `containerPadding` pixels inside the viewport. `offset` (8 pixels by default, room for the arrow) and `crossOffset` move it. The panel and its `ui-tooltip__arrow` publish the resolved side in `data-placement`.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.6 - Variants

`variant` shall publish `data-variant` on the panel: `default` (the hint for a control) or `info` (a softer explanatory note beside content).

Implementation: `src/components/tooltip/tooltip.tsx`, `labs/reference.css`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.7 - Controlled state

`isOpen` with `onOpenChange` shall control the panel, and `defaultOpen` shall open it initially; hover, focus, Escape and press then report changes through `onOpenChange`.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.8 - Hooks and caller attributes

The panel shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes. It publishes React Aria's `data-entering` and `data-exiting` during its transitions.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

## Hooks

| Hook                  | Kind      | Values                                     | Description                                             |
| --------------------- | --------- | ------------------------------------------ | ------------------------------------------------------- |
| `ui-tooltip`          | root      |                                            | The panel (`role="tooltip"`), portalled.                |
| `ui-tooltip__arrow`   | slot      |                                            | The arrow, positioned against the trigger.              |
| `ui-tooltip__content` | slot      |                                            | The hint content.                                       |
| `data-variant`        | attribute | `default`, `info`                          | Hint for a control or explanatory note.                 |
| `data-placement`      | state     | `top`, `bottom`, `left`, `right`, `center` | Resolved side, on the panel and the arrow (React Aria). |
| `data-entering`       | state     | `true`                                     | While opening (React Aria).                             |
| `data-exiting`        | state     | `true`                                     | While closing (React Aria).                             |
