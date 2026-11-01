# User Card Trigger

`UserCardTrigger` makes any content, such as an avatar, a name or a [User Identity](USER-IDENTITY.md) row, a button that opens a card, usually a [User Card](USER-CARD.md), in a popover, on press or on hover and focus. [Presence Avatar](AVATAR.md), [Presence Strip](AVATAR-GROUP.md) and [Attribution](ATTRIBUTION.md) open cards through it. It imports no card or identity code itself, so a component that only wraps content in it, such as `Avatar`, does not load `UserCard`.

## UIC-USER-CARD-TRIGGER-1 - Trigger

### UIC-USER-CARD-TRIGGER-1.1 - Wrapping content

`UserCardTrigger` shall render its children inside a button, the `ui-user-card-trigger` root while it has a card, named by that content, with `aria-expanded` reporting whether the card is open. It takes the press handlers (`onPress` runs as well as opening the card) and `isDisabled`, appends the caller's `className`, forwards caller `data-*` attributes and `id`, and publishes `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled` states. The reference stylesheet sets a trigger holding only text inline on the surrounding sentence's baseline, wrapping with it, and keeps triggers holding an avatar or an identity row as centred inline boxes.

Implementation: `src/components/user-card-trigger/user-card-trigger.tsx`, `labs/reference/user-card-trigger.css`
Verification: `src/components/user-card-trigger/user-card-trigger.test.tsx`, `e2e/user-card-trigger.spec.ts`

### UIC-USER-CARD-TRIGGER-1.2 - Opening and dismissing

A click, Enter or Space on the trigger shall open its `card` in a popover in the `ui-user-card-trigger__popover` slot, placed below the trigger and flipped or shifted to stay in the viewport, on the `dropdown` overlay layer (the [Popover](POPOVER.md#uic-popover-15---layering-and-transitions)'s floating panel), with focus moved into the card. Escape and a press outside shall close it and return focus to the trigger.

Implementation: `src/components/user-card-trigger/user-card-trigger.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/user-card-trigger/user-card-trigger.test.tsx`, `e2e/user-card-trigger.spec.ts`

### UIC-USER-CARD-TRIGGER-1.3 - Opening on hover and focus

With `trigger="hover"`, the trigger shall open the card in a [Hover Card](HOVER-CARD.md) (React Aria `PreviewTrigger`), whose element also carries `ui-hover-card`: the card opens `delay` milliseconds (600 by default) after the pointer rests on the trigger or keyboard focus reaches it, or on a long press, without moving focus; the popover publishes `data-trigger="PreviewTrigger"`. The trigger carries `aria-haspopup="dialog"` and `aria-expanded` and, while the card is open, is described by it. Tab from the trigger moves into the open card. The card stays open while the pointer travels between the trigger and the card, and closes `closeDelay` milliseconds (200 by default) after the pointer and focus have left both, or on Escape, keeping or returning focus to the trigger. Pressing the trigger runs `onPress` and does not toggle the card. A disabled trigger opens nothing.

Implementation: `src/components/user-card-trigger/user-card-trigger.tsx`, `src/components/hover-card/hover-card.tsx`
Verification: `src/components/user-card-trigger/user-card-trigger.test.tsx`, `e2e/user-card-trigger.spec.ts`

### UIC-USER-CARD-TRIGGER-1.4 - Controlled open state

`isOpen` with `onOpenChange` shall control whether the card is open, and `defaultOpen` shall open it at first when uncontrolled, in either trigger mode. `onOpenChange` reports each change the reader asks for, such as a press, Escape or the hover delays running out. A card open when the trigger turns disabled, in either mode, closes through `onOpenChange(false)`, once, focus leaving it as on a dismiss, and stays closed when the trigger is enabled again; a controlled card is drawn closed while disabled.

Implementation: `src/components/user-card-trigger/user-card-trigger.tsx`, `src/utils/use-close-when-locked.ts`
Verification: `src/components/user-card-trigger/user-card-trigger.test.tsx`, `src/components/user-card-trigger/user-card-trigger-locking.test.tsx`, `e2e/user-card-trigger.spec.ts`

### UIC-USER-CARD-TRIGGER-1.5 - Without a card

Without `card` (`undefined`, `null` or `false`), `UserCardTrigger` shall be a plain button that runs `onPress`, with no `ui-user-card-trigger` class, `aria-haspopup` or `aria-expanded`. A card that arrives or leaves later, or a change of `trigger`, keeps the same button element and its focus.

Implementation: `src/components/user-card-trigger/user-card-trigger.tsx`
Verification: `src/components/user-card-trigger/user-card-trigger.test.tsx`

## Hooks

| Hook                            | Kind  | Values                            | Description                                              |
| ------------------------------- | ----- | --------------------------------- | -------------------------------------------------------- |
| `ui-user-card-trigger`          | root  |                                   | The trigger button around the caller's content.          |
| `ui-user-card-trigger__popover` | slot  |                                   | The open card's popover (also `ui-hover-card` on hover). |
| `data-hovered`                  | state | `true`                            | Pointer over the trigger (React Aria).                   |
| `data-pressed`                  | state | `true`                            | The trigger is being pressed (React Aria).               |
| `data-focused`                  | state | `true`                            | The trigger has focus (React Aria).                      |
| `data-focus-visible`            | state | `true`                            | The trigger has keyboard focus (React Aria).             |
| `data-disabled`                 | state | `true`                            | A disabled trigger (React Aria).                         |
| `data-placement`                | state | `top`, `bottom`, `left`, `right`  | The popover's resolved side (React Aria).                |
| `data-trigger`                  | state | `DialogTrigger`, `PreviewTrigger` | Which React Aria trigger opened the popover.             |
| `data-entering`                 | state | `true`                            | The popover is opening (React Aria).                     |
| `data-exiting`                  | state | `true`                            | The popover is closing (React Aria).                     |
