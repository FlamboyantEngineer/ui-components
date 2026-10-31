# Tooltip

`Tooltip` shows a short, non-interactive hint for a control, built on React Aria's `TooltipTrigger` and `Tooltip`. It opens when its trigger is hovered or keyboard focused and closes when the reader moves on. Content the reader acts on belongs in a popover or menu, never in a tooltip. Text cut short by its box uses [Truncation Tooltip](TRUNCATION-TOOLTIP.md), which shares this panel's hooks. `AnchoredTooltip` shows the same panel, opened by the caller, against an element it already owns or a rectangle.

## UIC-TOOLTIP-1 - Contract

### UIC-TOOLTIP-1.1 - Trigger and panel

`Tooltip` shall wrap one focusable trigger (a library `Button` or `Link`) and render its `content` in the `ui-tooltip__content` slot of a panel with `role="tooltip"`, portalled to the end of the overlay container ([UIC-PORTAL-1.2](PORTAL.md#uic-portal-12---choosing-the-container)): the document body, or the container a `PortalHost` or `PortalContainerProvider` above chooses. The panel never takes focus, holds no interactive content and adds no wrapper element around the trigger.

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

While the panel is open, the trigger shall be described by it through `aria-describedby` (unless the hint is its label, [UIC-TOOLTIP-1.9](#uic-tooltip-19---label-relationship)), and the reference shall be removed when it closes. The trigger keeps its own accessible name. A trigger that sets its own `aria-describedby` keeps that value instead (React Aria gives the trigger's props precedence).

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.5 - Placement

`placement` (`top` by default, or any `Placement` such as `bottom`, `start` or `end top`) shall choose the preferred side; the panel flips to the opposite side when it does not fit and stays inside the viewport, 8 pixels from the trigger to leave room for the arrow. The panel and its `ui-tooltip__arrow` publish the resolved side in `data-placement`. The panel of `Tooltip` and of `AnchoredTooltip` sits on the `tooltip` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)): it publishes `data-layer="tooltip"` and takes its inline z-index from `useLayerZIndex('tooltip')` instead of React Aria's 100000, so it stacks above menus and below toasts and a provider's `layerZIndex` applies.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.6 - Variants

`variant` shall publish `data-variant` on the panel: `default` (the hint for a control) or `info` (a softer explanatory note beside content).

Implementation: `src/components/tooltip/tooltip.tsx`, `labs/reference/tooltip.css`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.7 - Controlled state

`isOpen` with `onOpenChange` shall control the panel, and `defaultOpen` shall open it initially; hover, focus, Escape and press then report changes through `onOpenChange`.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.8 - Hooks and caller attributes

The panel shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes. Its `id` stays React Aria's, which describes the trigger by it. It publishes React Aria's `data-entering` and `data-exiting` during its transitions.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.9 - Label relationship

With `relationship="label"` and string `content`, the hint shall be the trigger's accessible name whether the panel is open or not: the trigger element receives the content as its `aria-label` (it must forward `aria-label` to its focusable element, as `Button` and `Link` do). The open panel then describes nothing, so the name is read once; a trigger's own `aria-describedby` still wins. A trigger's own `aria-label` also wins, for a name that says more than the hint (a count, say); the hint still adds no description. Use it for a control whose only label is its hint, such as an icon-only segment or a collapsed navigation entry that is not a `Button`; an icon-only `Button` takes its hint through its own `tooltip` prop instead ([UIC-BUTTON-11.7](BUTTON.md)). Content that is not a string cannot be a name, so it describes the trigger as usual.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

## UIC-TOOLTIP-2 - Anchored tooltip

### UIC-TOOLTIP-2.1 - Existing elements

`AnchoredTooltip` shall show its `content` in the same panel and hooks as `Tooltip` (`ui-tooltip`, `role="tooltip"`), rendered straight into the overlay container that a [Portal](PORTAL.md) uses, with the `tooltip` layer's z-index, and nothing on the server or until hydrated while `isOpen` is true and hide it when false, pointing at an `anchor` the caller already owns: an HTML or SVG element, or a ref to one. It renders no trigger and nothing around the anchor, and nothing in it opens or closes the panel: the caller owns the state. The panel takes `variant`, `placement` (default `top`, flipping when it does not fit), the caller's `id`, `className` and `data-*`, and publishes `data-placement`, `data-entering` and `data-exiting` as `Tooltip` does. Its `ui-tooltip__arrow` sits out of the panel's flow on the side facing the anchor, as React Aria places `Tooltip`'s, so the panel is only as tall as its content.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-2.2 - Rectangles

An `anchor` with a `getBoundingClientRect()` method and no element, such as a text range or a region of a canvas, shall place the panel against that rectangle, in viewport pixels as `getBoundingClientRect` returns them, read again at each opening, scroll and resize, so a rectangle that moves takes the panel with it.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-2.3 - Relationships

The panel's `id` is the caller's `id`, or a stable generated one. While open, `relationship="description"` (the default) shall add it to an element anchor's `aria-describedby` and `relationship="label"` to its `aria-labelledby`, after the ids already there, and take it out again on close or unmount, leaving the other ids as they were (and no attribute when none remain). `relationship="none"` shows the hint visually only: the panel is `aria-hidden` and the anchor's name and description do not change, for a hint that repeats a name readers already hear. A rectangle anchor has no element, so no relationship.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`

### UIC-TOOLTIP-2.4 - Following and cleaning up

The open panel shall follow its anchor through page and container scrolling, window resizing and changes of the anchor's or the panel's size, without closing. With no anchor, a ref holding nothing, or an element no longer in the document, it shows nothing; unmounting it while open removes the panel and its relationship. The anchor element is read again after every render and, while open, whenever nodes come or go in its document: a stable ref that now holds a replacement element moves the relationship and the position to the replacement, an anchor that leaves the document hides the panel and releases its relationship, and one put back shows it again.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `e2e/tooltip.spec.ts`

## Hooks

| Hook                  | Kind      | Values                                     | Description                                             |
| --------------------- | --------- | ------------------------------------------ | ------------------------------------------------------- |
| `ui-tooltip`          | root      |                                            | The panel (`role="tooltip"`), portalled.                |
| `ui-tooltip__arrow`   | slot      |                                            | The arrow, positioned against the trigger.              |
| `ui-tooltip__content` | slot      |                                            | The hint content.                                       |
| `data-variant`        | attribute | `default`, `info`                          | Hint for a control or explanatory note.                 |
| `data-layer`          | attribute | `tooltip`                                  | The overlay layer; its z-index is set inline from it.   |
| `data-placement`      | state     | `top`, `bottom`, `left`, `right`, `center` | Resolved side, on the panel and the arrow (React Aria). |
| `data-entering`       | state     | `true`                                     | While opening (React Aria).                             |
| `data-exiting`        | state     | `true`                                     | While closing (React Aria).                             |
