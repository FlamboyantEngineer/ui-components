# Hover Card

`HoverCard` shows extra content about its trigger while the reader rests the pointer on it or focuses it, such as a preview of a linked page or a person's details. Unlike a [Tooltip](TOOLTIP.md), the card may hold interactive content the reader can move into. `HoverCardTrigger` is built on React Aria's `PreviewTrigger`, which times the opening and closing and keeps the card open while the pointer travels into it; the card is the [Popover](POPOVER.md)'s floating panel, sharing its positioning, arrow and layer. [User Card Trigger](USER-CARD-TRIGGER.md#uic-user-card-trigger-13---opening-on-hover-and-focus) opens its hover cards through it.

## UIC-HOVER-CARD-1 - Opening and closing

### UIC-HOVER-CARD-1.1 - Trigger

`HoverCardTrigger` shall hold one focusable trigger (a library `Link` or `Button`) and a `HoverCard`, and add no element of its own. The trigger carries `aria-haspopup="dialog"` and `aria-expanded` and, while the card is open, is described by it. Pressing the trigger runs its own action and does not toggle the card. A trigger with a hint of its own (a `Button` with `tooltip` or `shortcut`, or a trigger wrapped in a `Tooltip`) still opens the card: its hint yields to the card, as a [Tooltip](TOOLTIP.md#uic-tooltip-11---trigger-and-panel) inside a caller's trigger does.

Implementation: `src/components/hover-card/hover-card.tsx`
Verification: `src/components/hover-card/hover-card.test.tsx`, `e2e/hover-card.spec.ts`

### UIC-HOVER-CARD-1.2 - Opening

The card shall open `delay` milliseconds (600 by default) after a mouse or pen rests on the trigger or keyboard focus reaches it, without moving focus. The first genuine pointer movement onto the trigger shall work without a prior interaction elsewhere, including after programmatic focus. An enter caused only by layout or keyboard navigation while the input is not a pointer shall wait for genuine pointer movement. The pointer leaving the trigger first cancels the opening. Right after a card closes, a neighbouring trigger opens its card without the delay, and only one card is open at a time. On a touch device, which has no hover, a long press on the trigger opens the card at once and moves focus into it; while the reader uses touch, the trigger is described by React Aria's long-press hint.

Implementation: `src/components/hover-card/hover-card.tsx`, `src/utils/use-pointer-entry.tsx`
Verification: `src/components/hover-card/hover-card.test.tsx`, `src/utils/use-pointer-entry.test.tsx`, `e2e/hover-card.spec.ts`

### UIC-HOVER-CARD-1.3 - Staying open and closing

The card shall stay open while the pointer travels from the trigger into the card and while the pointer or focus is on either, and close `closeDelay` milliseconds (200 by default) after both have left them. Tab from the trigger moves into the open card. Escape closes it at once, keeping focus on the trigger or returning it there from inside the card. The card keeps its open state apart from React Aria's tooltips, which allow one open tooltip at a time: a [Tooltip](TOOLTIP.md) on a control inside the open card opens on keyboard focus and on hover, and the card stays open meanwhile.

Implementation: `src/components/hover-card/hover-card.tsx`, `src/utils/use-preview-state.ts`
Verification: `src/components/hover-card/hover-card.test.tsx`, `e2e/hover-card.spec.ts`

### UIC-HOVER-CARD-1.4 - Controlled state

`isOpen` with `onOpenChange` on the trigger shall control the card, and `defaultOpen` shall open it at first; hover, focus, Escape and the delays running out report changes through `onOpenChange`. `isDisabled` opens nothing and draws the card closed even while a controlled owner keeps `isOpen` true. An open card, by `isOpen`, `defaultOpen` or an interaction, is closed once per change to disabled through `onOpenChange(false)`, so an uncontrolled card stays closed when the trigger is enabled again. The trigger is left as it would be without the card (no `aria-haspopup`, `aria-expanded` or description), while keeping the trigger mounted, so a card can come and go around a focused trigger.

Implementation: `src/components/hover-card/hover-card.tsx`
Verification: `src/components/hover-card/hover-card.test.tsx`, `e2e/hover-card.spec.ts`

## UIC-HOVER-CARD-2 - Card

### UIC-HOVER-CARD-2.1 - Content and name

`HoverCard` shall render its children in the `ui-hover-card` element, portalled to the end of the document body, as a non-modal `role="dialog"` that never takes focus on open and leaves the page usable. `aria-label` or `aria-labelledby` names it. When the children hold their own `role="dialog"` element, the card is a plain container around it.

Implementation: `src/components/hover-card/hover-card.tsx`
Verification: `src/components/hover-card/hover-card.test.tsx`, `e2e/hover-card.spec.ts`

### UIC-HOVER-CARD-2.2 - Placement, arrow and layer

The card shall take the popover's placement props ([UIC-POPOVER-1.3](POPOVER.md#uic-popover-13---placement)): `placement` (`bottom` by default), `offset`, `crossOffset`, `containerPadding` and `shouldFlip`, and publish the resolved side in `data-placement`. `showArrow` renders a `ui-hover-card__arrow` element pointing at the trigger, publishing the same side. The card carries the z-index of the `dropdown` overlay layer as a functional inline style.

Implementation: `src/components/hover-card/hover-card.tsx`, `src/components/popover/popover.tsx`, `labs/reference/hover-card.css`
Verification: `src/components/hover-card/hover-card.test.tsx`, `e2e/hover-card.spec.ts`

### UIC-HOVER-CARD-2.3 - Hooks and caller attributes

`HoverCard` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes and `id` to the card, and publish `data-trigger="PreviewTrigger"`, and `data-entering` and `data-exiting` while its animations run.

Implementation: `src/components/hover-card/hover-card.tsx`
Verification: `src/components/hover-card/hover-card.test.tsx`

## Hooks

| Hook                   | Kind  | Values                           | Description                                                |
| ---------------------- | ----- | -------------------------------- | ---------------------------------------------------------- |
| `ui-hover-card`        | root  |                                  | The card (React Aria `Popover`), portalled.                |
| `ui-hover-card__arrow` | slot  |                                  | The arrow pointing at the trigger.                         |
| `data-placement`       | state | `top`, `bottom`, `left`, `right` | The resolved side, on the card and the arrow (React Aria). |
| `data-trigger`         | state | `PreviewTrigger`                 | What opened the card (React Aria).                         |
| `data-entering`        | state | `true`                           | While the card opens (React Aria).                         |
| `data-exiting`         | state | `true`                           | While the card closes (React Aria).                        |
