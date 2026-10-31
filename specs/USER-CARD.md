# User Card

`UserCard` is the identity card of a person or a group: their avatar, name and secondary line, an optional status row, detail rows and actions such as sending a message or opening a profile. It takes plain data and reports actions through a callback. `UserCardTrigger` makes any content, such as an avatar, a name or a [User Identity](USER-IDENTITY.md) row, a button that opens a card in a popover, on press or on hover and focus; [Presence Avatar](AVATAR.md) and [Presence Strip](AVATAR-GROUP.md) open cards through it.

## UIC-USER-CARD-1 - Card

### UIC-USER-CARD-1.1 - Identity

`UserCard` shall draw a `UserIdentity` in the `ui-user-card__identity` slot with the card's `name`, `description`, `src`, `imageProps`, `initials`, `colorKey`, `colorIndex`, `colorCount`, `kind` and `shape`, so the card follows the identity row's name, secondary line, picture fallback, initials, colour slot and group glyph rules ([USER-IDENTITY.md](USER-IDENTITY.md)). A blank `name` reads as the provider's `unnamed` string. Text is rendered as text, never as markup.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.2 - Status

A non-blank `status` shall be published, trimmed, in `data-status` on the root, a word the host stylesheet maps to a look (`active`, `away`, …). A non-blank `statusLabel` shall draw a `ui-user-card__status` row holding a decorative `ui-user-card__indicator` and the trimmed label in `ui-user-card__status-label`. Without a status label there is no status row.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.3 - Details

`details` shall draw a `DescriptionList` in the `ui-user-card__details` slot with one row per detail, in order, each showing its `label` and `value` as given ([DESCRIPTION-LIST.md](DESCRIPTION-LIST.md)). Each detail's `id`, unique among them, identifies its row, so a value keeps its state and focus when details are added, removed or reordered; labels, which may repeat or be translated, never identify a row. Without details there is no list.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `src/components/user-card/user-card-detail-identity.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.4 - Actions

`actions` shall draw a `ui-user-card__actions` group holding one small `Button` per action, in order, in the `ui-user-card__action` slot, labelled by the action's `label` with its optional `icon` before it. Pressing an action shall call `onAction` once with the action's `id`. In a card that a `UserCardTrigger` opened, on press or on hover, the card closes first (reported through `onOpenChange`) and focus returns to the trigger when the card held it. A card rendered anywhere else closes nothing, not even an overlay it sits in, such as a modal. Without actions there is no group.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.5 - Accessibility

The card shall be a `role="dialog"` named by the display name, or by the caller's `aria-label`. Its avatar and status indicator are decorative, so the name, secondary line, status label, details and actions are what is read. Only a card that a `UserCardTrigger` opens on press takes focus when it appears; a card rendered in place, inside another overlay such as a modal included, or shown in a hover card ([UIC-USER-CARD-2.3](#uic-user-card-23---opening-on-hover-and-focus)), takes no focus and its actions are reached in the tab order.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.6 - Hooks and caller attributes

`UserCard` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`

### UIC-USER-CARD-1.7 - Loading

While `isLoading`, the card shall publish `data-loading`, set `aria-busy="true"` and draw a decorative `ui-user-card__skeleton` slot, hidden from assistive technology, in place of its status row, details and actions, so a card opened before its profile has loaded keeps its size. The slot is a [Skeleton](SKELETON.md) block, so it also carries `ui-skeleton` and its attributes and a host draws it like its other placeholders. The identity row stays. Without it neither attribute renders.

Implementation: `src/components/user-card/user-card.tsx`, `src/components/skeleton/skeleton.tsx`, `labs/reference/user-card.css`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

## UIC-USER-CARD-2 - Trigger

### UIC-USER-CARD-2.1 - Wrapping content

`UserCardTrigger` shall render its children inside a button in the `ui-user-card__trigger` slot, named by that content, with `aria-expanded` reporting whether the card is open. It takes the press handlers (`onPress` runs as well as opening the card) and `isDisabled`, appends the caller's `className`, forwards caller `data-*` attributes and `id`, and publishes `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled` states.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-2.2 - Opening and dismissing

A click, Enter or Space on the trigger shall open its `card` in a popover in the `ui-user-card__popover` slot, placed below the trigger and flipped or shifted to stay in the viewport, on the `dropdown` overlay layer (the [Popover](POPOVER.md#uic-popover-15---layering-and-transitions)'s floating panel), with focus moved into the card. Escape and a press outside shall close it and return focus to the trigger.

Implementation: `src/components/user-card/user-card.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-2.3 - Opening on hover and focus

With `trigger="hover"`, the trigger shall open the card in a [Hover Card](HOVER-CARD.md) (React Aria `PreviewTrigger`), whose element also carries `ui-hover-card`: the card opens `delay` milliseconds (600 by default) after the pointer rests on the trigger or keyboard focus reaches it, or on a long press, without moving focus; the popover publishes `data-trigger="PreviewTrigger"`. The trigger carries `aria-haspopup="dialog"` and `aria-expanded` and, while the card is open, is described by it. Tab from the trigger moves into the open card. The card stays open while the pointer travels between the trigger and the card, and closes `closeDelay` milliseconds (200 by default) after the pointer and focus have left both, or on Escape, keeping or returning focus to the trigger. Pressing the trigger runs `onPress` and does not toggle the card. A disabled trigger opens nothing.

Implementation: `src/components/user-card/user-card.tsx`, `src/components/hover-card/hover-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-2.4 - Controlled open state

`isOpen` with `onOpenChange` shall control whether the card is open, and `defaultOpen` shall open it at first when uncontrolled, in either trigger mode. `onOpenChange` reports each change the reader asks for, such as a press, Escape or the hover delays running out.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-2.5 - Without a card

Without `card` (`undefined`, `null` or `false`), `UserCardTrigger` shall be a plain button that runs `onPress`, with no `ui-user-card__trigger` class, `aria-haspopup` or `aria-expanded`. A card that arrives or leaves later, or a change of `trigger`, keeps the same button element and its focus.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`

## Hooks

| Hook                         | Kind      | Values                            | Description                                                    |
| ---------------------------- | --------- | --------------------------------- | -------------------------------------------------------------- |
| `ui-user-card`               | root      |                                   | The card (`role="dialog"`).                                    |
| `ui-user-card__identity`     | slot      |                                   | The avatar, name and secondary line (also `ui-user-identity`). |
| `ui-user-card__status`       | slot      |                                   | The status row, when there is a status label.                  |
| `ui-user-card__indicator`    | slot      |                                   | The decorative status indicator.                               |
| `ui-user-card__status-label` | slot      |                                   | The status label.                                              |
| `ui-user-card__details`      | slot      |                                   | The detail rows (also `ui-description-list`).                  |
| `ui-user-card__actions`      | slot      |                                   | The group of action buttons.                                   |
| `ui-user-card__action`       | slot      |                                   | One action (also `ui-button`).                                 |
| `ui-user-card__trigger`      | slot      |                                   | The trigger button around the caller's content.                |
| `ui-user-card__popover`      | slot      |                                   | The open card's popover (also `ui-hover-card` on hover).       |
| `ui-user-card__skeleton`     | slot      |                                   | The placeholder while the profile loads (also `ui-skeleton`).  |
| `data-status`                | attribute |                                   | The caller's status word, on the card.                         |
| `data-loading`               | state     | `true`                            | The card's profile is loading.                                 |
| `data-hovered`               | state     | `true`                            | Pointer over the trigger (React Aria).                         |
| `data-pressed`               | state     | `true`                            | The trigger is being pressed (React Aria).                     |
| `data-focused`               | state     | `true`                            | The trigger has focus (React Aria).                            |
| `data-focus-visible`         | state     | `true`                            | The trigger has keyboard focus (React Aria).                   |
| `data-disabled`              | state     | `true`                            | A disabled trigger (React Aria).                               |
| `data-placement`             | state     | `top`, `bottom`, `left`, `right`  | The popover's resolved side (React Aria).                      |
| `data-trigger`               | state     | `DialogTrigger`, `PreviewTrigger` | Which React Aria trigger opened the popover.                   |
| `data-entering`              | state     | `true`                            | The popover is opening (React Aria).                           |
| `data-exiting`               | state     | `true`                            | The popover is closing (React Aria).                           |
