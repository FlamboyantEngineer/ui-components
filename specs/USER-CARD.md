# User Card

`UserCard` is the identity card of a person or a group: their avatar, name and secondary line, an optional status row, detail rows and actions such as sending a message or opening a profile. It takes plain data and reports actions through a callback. `UserCardTrigger` makes any content, such as an avatar, a name or a [User Identity](USER-IDENTITY.md) row, a button that opens a card in a popover; [Presence Avatar](PRESENCE-AVATAR.md) and [Presence Strip](PRESENCE-STRIP.md) open cards through it.

## UIC-USER-CARD-1 - Card

### UIC-USER-CARD-1.1 - Identity

`UserCard` shall draw a `UserIdentity` in the `ui-user-card__identity` slot with the card's `name`, `description`, `src`, `initials`, `colorKey`, `colorIndex`, `colorCount` and `kind`, so the card follows the identity row's name, secondary line, picture fallback, initials, colour slot and group glyph rules ([USER-IDENTITY.md](USER-IDENTITY.md)). A blank `name` reads as the provider's `unnamed` string. Text is rendered as text, never as markup.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.2 - Status

A non-blank `status` shall be published, trimmed, in `data-status` on the root, a word the host stylesheet maps to a look (`active`, `away`, …). A non-blank `statusLabel` shall draw a `ui-user-card__status` row holding a decorative `ui-user-card__indicator` and the trimmed label in `ui-user-card__status-label`. Without a status label there is no status row.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.3 - Details

`details` shall draw a `DescriptionList` in the `ui-user-card__details` slot with one row per detail, in order, each showing its `label` and `value` as given ([DESCRIPTION-LIST.md](DESCRIPTION-LIST.md)). Without details there is no list.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`

### UIC-USER-CARD-1.4 - Actions

`actions` shall draw a `ui-user-card__actions` group holding one small `Button` per action, in order, in the `ui-user-card__action` slot, labelled by the action's `label` with its optional `icon` before it. Pressing an action shall call `onAction` once with the action's `id`; inside a dialog trigger the card closes first and focus returns to the trigger. Without actions there is no group.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.5 - Accessibility

The card shall be a `role="dialog"` named by the display name, or by the caller's `aria-label`. Its avatar and status indicator are decorative, so the name, secondary line, status label, details and actions are what is read.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.6 - Hooks and caller attributes

`UserCard` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`

## UIC-USER-CARD-2 - Trigger

### UIC-USER-CARD-2.1 - Wrapping content

`UserCardTrigger` shall render its children inside a React Aria button in the `ui-user-card__trigger` slot, named by that content, with `aria-expanded` reporting whether the card is open. It passes React Aria's button props through (`onPress` runs as well as opening the card), appends the caller's `className`, forwards caller `data-*` attributes and `id`, and publishes React Aria's `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible` and `data-disabled` states.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-2.2 - Opening and dismissing

A click, Enter or Space on the trigger shall open its `card` in a popover in the `ui-user-card__popover` slot, placed below the trigger and flipped or shifted to stay in the viewport, with focus moved into the card. Escape and a press outside shall close it and return focus to the trigger.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

## Hooks

| Hook                         | Kind      | Values                           | Description                                                    |
| ---------------------------- | --------- | -------------------------------- | -------------------------------------------------------------- |
| `ui-user-card`               | root      |                                  | The card (`role="dialog"`).                                    |
| `ui-user-card__identity`     | slot      |                                  | The avatar, name and secondary line (also `ui-user-identity`). |
| `ui-user-card__status`       | slot      |                                  | The status row, when there is a status label.                  |
| `ui-user-card__indicator`    | slot      |                                  | The decorative status indicator.                               |
| `ui-user-card__status-label` | slot      |                                  | The status label.                                              |
| `ui-user-card__details`      | slot      |                                  | The detail rows (also `ui-description-list`).                  |
| `ui-user-card__actions`      | slot      |                                  | The group of action buttons.                                   |
| `ui-user-card__action`       | slot      |                                  | One action (also `ui-button`).                                 |
| `ui-user-card__trigger`      | slot      |                                  | The trigger button around the caller's content.                |
| `ui-user-card__popover`      | slot      |                                  | The popover holding an open card.                              |
| `data-status`                | attribute |                                  | The caller's status word, on the card.                         |
| `data-hovered`               | state     | `true`                           | Pointer over the trigger (React Aria).                         |
| `data-pressed`               | state     | `true`                           | The trigger is being pressed (React Aria).                     |
| `data-focused`               | state     | `true`                           | The trigger has focus (React Aria).                            |
| `data-focus-visible`         | state     | `true`                           | The trigger has keyboard focus (React Aria).                   |
| `data-disabled`              | state     | `true`                           | A disabled trigger (React Aria).                               |
| `data-placement`             | state     | `top`, `bottom`, `left`, `right` | The popover's resolved side (React Aria).                      |
| `data-trigger`               | state     | `DialogTrigger`                  | Which React Aria trigger opened the popover.                   |
| `data-entering`              | state     | `true`                           | The popover is opening (React Aria).                           |
| `data-exiting`               | state     | `true`                           | The popover is closing (React Aria).                           |
