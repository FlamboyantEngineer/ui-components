# User Card

`UserCard` is the identity card of a person or a group: their avatar, name and secondary line, an optional status row, detail rows and actions such as sending a message or opening a profile. It takes plain data and reports actions through a callback. A [User Card Trigger](USER-CARD-TRIGGER.md) opens a card from an avatar, a name or a row.

## UIC-USER-CARD-1 - Card

### UIC-USER-CARD-1.1 - Identity

`UserCard` shall draw a `UserIdentity` in the `ui-user-card__identity` slot with the card's `name`, `description`, `src`, `imageProps`, `initials`, `colorKey`, `colorIndex`, `colorCount`, `kind` and `shape`, so the card follows the identity row's name, secondary line, picture fallback, initials, colour slot and group glyph rules ([USER-IDENTITY.md](USER-IDENTITY.md)). A blank `name` reads as the provider's `unnamed` string. Text is rendered as text, never as markup.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.2 - Status

A `status` (a `PresenceStatus`, as on [Avatar](AVATAR.md#uic-avatar-111---avatar-and-status)) shall be published in `data-status` on the root. A status in words, the trimmed `statusLabel` or else the provider's `presenceStatus` string for `status`, shall draw a `ui-user-card__status` row holding a decorative `ui-user-card__indicator` and that text in `ui-user-card__status-label`. With neither there is no status row.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.3 - Details

`details` shall draw a `DescriptionList` in the `ui-user-card__details` slot with one row per detail, in order, each showing its `label` and `value` as given ([DESCRIPTION-LIST.md](DESCRIPTION-LIST.md)). Each detail's `id`, unique among them, identifies its row, so a value keeps its state and focus when details are added, removed or reordered; labels, which may repeat or be translated, never identify a row. Without details there is no list.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `src/components/user-card/user-card-detail-identity.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.4 - Actions

`actions` shall draw a `ui-user-card__actions` group holding one small `Button` per action, in order, in the `ui-user-card__action` slot, labelled by the action's `label` with its optional `icon` before it. Pressing an action shall call `onAction` once with the action's `id`. In a card that a `UserCardTrigger` opened, on press or on hover, the card closes first (reported through `onOpenChange`) and focus returns to the trigger when the card held it, including when the trigger and card render inside a shadow root. A card rendered anywhere else closes nothing, not even an overlay it sits in, such as a modal. Without actions there is no group.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `src/components/user-card-trigger/user-card-trigger.test.tsx`, `e2e/user-card.spec.ts`, `e2e/user-card-trigger.spec.ts`

### UIC-USER-CARD-1.5 - Accessibility

The card shall be a `role="dialog"` named by the display name, or by the caller's `aria-label`. Its avatar and status indicator are decorative, so the name, secondary line, status label, details and actions are what is read. Only a card that a `UserCardTrigger` opens on press takes focus when it appears; a card rendered in place, inside another overlay such as a modal included, or shown in a hover card ([UIC-USER-CARD-TRIGGER-1.3](USER-CARD-TRIGGER.md#uic-user-card-trigger-13---opening-on-hover-and-focus)), takes no focus and its actions are reached in the tab order.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`

### UIC-USER-CARD-1.6 - Hooks and caller attributes

`UserCard` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/user-card/user-card.tsx`
Verification: `src/components/user-card/user-card.test.tsx`

### UIC-USER-CARD-1.7 - Loading

While `isLoading`, the card shall publish `data-loading`, set `aria-busy="true"` and draw a decorative `ui-user-card__skeleton` slot, hidden from assistive technology, in place of its status row, details and actions, so a card opened before its profile has loaded keeps its size. The slot is a [Skeleton](SKELETON.md) block, so it also carries `ui-skeleton` and its attributes and a host draws it like its other placeholders. The identity row stays. Without it neither attribute renders.

Implementation: `src/components/user-card/user-card.tsx`, `src/components/skeleton/skeleton.tsx`, `labs/reference/user-card.css`
Verification: `src/components/user-card/user-card.test.tsx`, `e2e/user-card.spec.ts`, `e2e/user-card-trigger.spec.ts`

## Hooks

| Hook                         | Kind      | Values | Description                                                    |
| ---------------------------- | --------- | ------ | -------------------------------------------------------------- |
| `ui-user-card`               | root      |        | The card (`role="dialog"`).                                    |
| `ui-user-card__identity`     | slot      |        | The avatar, name and secondary line (also `ui-user-identity`). |
| `ui-user-card__status`       | slot      |        | The status row, when there is a status label.                  |
| `ui-user-card__indicator`    | slot      |        | The decorative status indicator.                               |
| `ui-user-card__status-label` | slot      |        | The status label.                                              |
| `ui-user-card__details`      | slot      |        | The detail rows (also `ui-description-list`).                  |
| `ui-user-card__actions`      | slot      |        | The group of action buttons.                                   |
| `ui-user-card__action`       | slot      |        | One action (also `ui-button`).                                 |
| `ui-user-card__skeleton`     | slot      |        | The placeholder while the profile loads (also `ui-skeleton`).  |
| `data-status`                | attribute |        | The `status`: `active`, `away`, `busy` or `idle`.              |
| `data-loading`               | state     | `true` | The card's profile is loading.                                 |
