# Hover Card

`HoverCard` shows extra content about its trigger while the reader rests the pointer on it or focuses it, such as a preview of a linked page or a person's details. Unlike a [Tooltip](TOOLTIP.md), the card may hold interactive content the reader can move into. `HoverCardTrigger` is built on React Aria's `PreviewTrigger`, which times the opening and closing and keeps the card open while the pointer travels into it; the card is the [Popover](POPOVER.md)'s floating panel, sharing its positioning, arrow and layer. [Preview Trigger](#uic-hover-card-43---opening-on-hover-and-focus) opens its hover cards through it.

## UIC-HOVER-CARD-1 - Opening and closing

### UIC-HOVER-CARD-1.1 - Trigger

`HoverCardTrigger` shall hold one focusable trigger (a library `Link` or `Button`) and a `HoverCard`, and add no element of its own. The trigger carries `aria-haspopup="dialog"` and `aria-expanded` and, while the card is open, is described by it. Pressing the trigger runs its own action and does not toggle the card. A trigger with a hint of its own (a `Button` with `tooltip` or `shortcut`, or a trigger wrapped in a `Tooltip`) still opens the card: its hint yields to the card, as a [Tooltip](TOOLTIP.md#uic-tooltip-11---trigger-and-panel) inside a caller's trigger does.

Implementation: `src/components/hover-card/hover-card.tsx`
Verification: `src/components/hover-card/hover-card.test.tsx`, `e2e/hover-card.spec.ts`

### UIC-HOVER-CARD-1.2 - Opening

The card shall open `delay` milliseconds (600 by default) after a mouse or pen rests on the trigger or keyboard focus reaches it, without moving focus. The first genuine pointer movement onto the trigger shall work without a prior interaction elsewhere, including after programmatic focus. An enter caused only by layout or keyboard navigation while the input is not a pointer shall wait for genuine pointer movement. The pointer leaving the trigger first cancels the opening. Right after a card closes, a neighbouring trigger opens its card without the delay, and only one card is open at a time. This handoff window lasts `Math.max(500, closeDelay)` milliseconds after the final open card closes, is externally closed, or its trigger unmounts; after that window, the configured opening delay applies again. Replacing a card keeps the window warm while the replacement is open, including when the previous trigger unmounts. A card opened through `isOpen` or `defaultOpen` keeps the window warm while it remains mounted and open. On a touch device, which has no hover, a long press on the trigger opens the card at once and moves focus into it; while the reader uses touch, the trigger is described by React Aria's long-press hint.

Implementation: `src/components/hover-card/hover-card.tsx`, `src/utils/use-pointer-entry.tsx`, `src/utils/use-preview-state.ts`
Verification: `src/components/hover-card/hover-card.test.tsx`, `src/utils/use-pointer-entry.test.tsx`, `src/utils/use-preview-state.test.tsx`, `e2e/hover-card.spec.ts`, `e2e/hover-card-coverage.spec.ts`

### UIC-HOVER-CARD-1.3 - Staying open and closing

The card shall stay open while the pointer travels from the trigger into the card and while the pointer or focus is on either, and close `closeDelay` milliseconds (200 by default) after both have left them. Tab from the trigger moves into the open card. Escape closes it at once, keeping focus on the trigger or returning it there from inside the card. When a hover left focus elsewhere on the page, an otherwise unhandled Escape closes the current card without moving that focus. A handled key, text composition, an interactive overlay or an owning dialog keeps its own Escape behavior. The card keeps its open state apart from React Aria's tooltips, which allow one open tooltip at a time: a [Tooltip](TOOLTIP.md) on a control inside the open card opens on keyboard focus and on hover, and the card stays open meanwhile.

Implementation: `src/components/hover-card/hover-card.tsx`, `src/utils/use-preview-state.ts`, `src/utils/use-preview-escape.ts`
Verification: `src/components/hover-card/hover-card.test.tsx`, `src/utils/use-preview-escape.test.tsx`, `e2e/hover-card.spec.ts`

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

## UIC-HOVER-CARD-3 - Composition

### UIC-HOVER-CARD-3.1 - Preview triggers in tags

A `HoverCardTrigger` inside a `Tag` shall let its ordinary button open the card on hover and keyboard focus without acting as the tag's remove button, and Escape closes the preview. The tag's own remove button keeps its action; a group without `onRemove` offers no removal and ignores Delete. Tab from that trigger moves into the open card's first control, and without one leaves through ordinary navigation, the tag's row not taking the focus back. A `PreviewTrigger` with `trigger="hover"` composes the same way.

Implementation: `src/components/hover-card/hover-card.tsx`
Verification: `src/components/hover-card/hover-card-tag.test.tsx`

## Preview Trigger

`PreviewTrigger` makes any content, such as an avatar, a name or a [User Identity](USER-IDENTITY.md) row, a button that opens a card, such as a person's details, in a popover, on press or on hover and focus. [Presence Avatar](AVATAR.md), [Presence Strip](AVATAR-GROUP.md) and [Attribution](ATTRIBUTION.md) open cards through it. It imports no card or identity code itself, so a component that only wraps content in it, such as `Avatar`, does not load the card's content.

## UIC-HOVER-CARD-4 - Trigger

### UIC-HOVER-CARD-4.1 - Wrapping content

`PreviewTrigger` shall render its children inside a button, the `ui-preview-trigger` root while it has a card, named by that content, with `aria-expanded` reporting whether the card is open. It takes the press handlers (`onPress` runs as well as opening the card) and `isDisabled`, appends the caller's `className`, forwards caller `data-*` attributes and `id`, and publishes `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled` states. The reference stylesheet sets a trigger holding only text inline on the surrounding sentence's baseline, wrapping with it, and keeps triggers holding an avatar or an identity row as centred inline boxes.

Implementation: `src/components/hover-card/preview-trigger.tsx`, `labs/reference/hover-card.css`
Verification: `src/components/hover-card/preview-trigger.test.tsx`, `src/components/hover-card/hover-card-tag.test.tsx`, `e2e/hover-card-preview-trigger.spec.ts`

### UIC-HOVER-CARD-4.2 - Opening and dismissing

A click, Enter or Space on the trigger shall open its `card` in a popover in the `ui-preview-trigger__popover` slot, placed below the trigger and flipped or shifted to stay in the viewport, on the `dropdown` overlay layer (the [Popover](POPOVER.md#uic-popover-15---layering-and-transitions)'s floating panel), with focus moved into the card. Escape and a press outside shall close it and return focus to the trigger.

Implementation: `src/components/hover-card/preview-trigger.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/hover-card/preview-trigger.test.tsx`, `e2e/hover-card-preview-trigger.spec.ts`

### UIC-HOVER-CARD-4.3 - Opening on hover and focus

With `trigger="hover"`, the trigger shall open the card in a [Hover Card](HOVER-CARD.md) (React Aria `PreviewTrigger`), whose element also carries `ui-hover-card`: the card opens `delay` milliseconds (600 by default) after the pointer rests on the trigger or keyboard focus reaches it, or on a long press, without moving focus; the popover publishes `data-trigger="PreviewTrigger"`. The trigger carries `aria-haspopup="dialog"` and `aria-expanded` and, while the card is open, is described by it. Tab from the trigger moves into the open card. The card stays open while the pointer travels between the trigger and the card, and closes `closeDelay` milliseconds (200 by default) after the pointer and focus have left both, or on Escape, keeping or returning focus to the trigger. An otherwise unhandled Escape also closes a hovered card while focus remains elsewhere on the page, without moving that focus, following the Hover Card's Escape ownership and composition guards. Pressing the trigger runs `onPress` and does not toggle the card. A disabled trigger opens nothing.

Implementation: `src/components/hover-card/preview-trigger.tsx`, `src/components/hover-card/preview-opening.ts`, `src/components/hover-card/hover-card.tsx`, `src/utils/use-pointer-entry.tsx`, `src/utils/use-preview-escape.ts`
Verification: `src/components/hover-card/preview-trigger.test.tsx`, `e2e/hover-card-preview-trigger.spec.ts`

### UIC-HOVER-CARD-4.4 - Controlled open state

`isOpen` with `onOpenChange` shall control whether the card is open, and `defaultOpen` shall open it at first when uncontrolled, in either trigger mode. `onOpenChange` reports each change the reader asks for, such as a press, Escape or the hover delays running out. A card open when the trigger turns disabled, in either mode, closes through `onOpenChange(false)`, once, focus leaving it as on a dismiss, and stays closed when the trigger is enabled again; a controlled card is drawn closed while disabled.

Implementation: `src/components/hover-card/preview-trigger.tsx`, `src/utils/use-close-when-locked.ts`
Verification: `src/components/hover-card/preview-trigger.test.tsx`, `src/components/hover-card/preview-trigger-locking.test.tsx`, `e2e/hover-card-preview-trigger.spec.ts`

### UIC-HOVER-CARD-4.5 - Without a card

Without `card` (`undefined`, `null` or `false`), `PreviewTrigger` shall be a plain button that runs `onPress`, with no `ui-preview-trigger` class, `aria-haspopup` or `aria-expanded`. A card that arrives or leaves later, or a change of `trigger`, keeps the same button element and its focus.

Implementation: `src/components/hover-card/preview-trigger.tsx`
Verification: `src/components/hover-card/preview-trigger.test.tsx`

`PreviewTrigger` accepts arbitrary `preview` content. It owns the named dialog and focus behavior: press previews take focus through React Aria Dialog; hover previews retain focus on the trigger. `previewLabel` overrides the dialog name, which otherwise comes from the trigger. Actions can call `usePreviewOwner()?.dismiss(event.target)` before host policy.

## Hooks

| Hook                          | Kind  | Values / Meaning                  |
| ----------------------------- | ----- | --------------------------------- |
| `ui-hover-card`               | root  | `hover-card-content`              | The card (React Aria `Popover`), portalled.                |
| `ui-hover-card__arrow`        | slot  |                                   | The arrow pointing at the trigger.                         |
| `data-placement`              | state | `top`, `bottom`, `left`, `right`  | The resolved side, on the card and the arrow (React Aria). |
| `data-trigger`                | state | `PreviewTrigger`                  | What opened the card (React Aria).                         |
| `data-entering`               | state | `true`                            | While the card opens (React Aria).                         |
| `data-exiting`                | state | `true`                            | While the card closes (React Aria).                        |
| `ui-preview-trigger`          | root  | `hover-card-trigger`              | The trigger button around the caller's content.            |
| `ui-preview-trigger__content` | slot  | Named dialog content              |
| `ui-preview-trigger__popover` | slot  |                                   | The open card's popover (also `ui-hover-card` on hover).   |
| `data-hovered`                | state | `true`                            | Pointer over the trigger (React Aria).                     |
| `data-pressed`                | state | `true`                            | The trigger is being pressed (React Aria).                 |
| `data-focused`                | state | `true`                            | The trigger has focus (React Aria).                        |
| `data-focus-visible`          | state | `true`                            | The trigger has keyboard focus (React Aria).               |
| `data-disabled`               | state | `true`                            | A disabled trigger (React Aria).                           |
| `data-placement`              | state | `top`, `bottom`, `left`, `right`  | The popover's resolved side (React Aria).                  |
| `data-trigger`                | state | `DialogTrigger`, `PreviewTrigger` | Which React Aria trigger opened the popover.               |
| `data-entering`               | state | `true`                            | The popover is opening (React Aria).                       |
| `data-exiting`                | state | `true`                            | The popover is closing (React Aria).                       |
