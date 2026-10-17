# Presence Avatar

`PresenceAvatar` draws one person who is present, such as someone viewing the same page, as an avatar marked with what they are doing. Statuses are words the caller chooses; the library publishes them and the host stylesheet decides how each one looks.

## UIC-PRESENCE-AVATAR-1 - Contract

### UIC-PRESENCE-AVATAR-1.1 - Avatar and status

`PresenceAvatar` shall draw an `Avatar` in the `ui-presence-avatar__avatar` slot, passing it `name`, `src`, `initials`, `colorKey`, `colorIndex`, `colorCount` and `kind` ([AVATAR.md](AVATAR.md)). A non-blank `status` shall be published, trimmed, in `data-status` on the root, together with a decorative `ui-presence-avatar__indicator` element the stylesheet can draw as a badge. Without a status neither renders.

Implementation: `src/components/presence-avatar/presence-avatar.tsx`
Verification: `src/components/presence-avatar/presence-avatar.test.tsx`, `e2e/presence-avatar.spec.ts`

### UIC-PRESENCE-AVATAR-1.2 - Accessible name

The avatar shall be the `role="img"` that names the person: by the trimmed `name` (or the provider's `unnamed` string when it is blank), joined with the trimmed `statusLabel` through the provider's `nameWithStatus` string when a status label is given (`Maria Santos, Away`). The root adds no role or label of its own, so a pressable root takes its name from that image and its visible initials never conflict with a separate label.

Implementation: `src/components/presence-avatar/presence-avatar.tsx`, `src/components/avatar/avatar.tsx`, `src/core/strings.ts`
Verification: `src/components/presence-avatar/presence-avatar.test.tsx`, `e2e/presence-avatar.spec.ts`

### UIC-PRESENCE-AVATAR-1.3 - Pressing

With `onPress`, the root shall be a React Aria button: one tab stop that calls `onPress` once for a click, Enter or Space, takes focus when clicked, does not repeat for a held key, and publishes React Aria's `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` states. Without `onPress` or `card` the root is a plain `<span>` with no tab stop.

Implementation: `src/components/presence-avatar/presence-avatar.tsx`
Verification: `src/components/presence-avatar/presence-avatar.test.tsx`, `e2e/presence-avatar.spec.ts`

### UIC-PRESENCE-AVATAR-1.4 - Sizes

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root and size the avatar to match.

Implementation: `src/components/presence-avatar/presence-avatar.tsx`, `labs/reference/presence-avatar.css`
Verification: `src/components/presence-avatar/presence-avatar.test.tsx`, `e2e/presence-avatar.spec.ts`

### UIC-PRESENCE-AVATAR-1.5 - Hooks and caller attributes

`PresenceAvatar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/presence-avatar/presence-avatar.tsx`
Verification: `src/components/presence-avatar/presence-avatar.test.tsx`

### UIC-PRESENCE-AVATAR-1.6 - Person card

With `card`, the root shall be a `UserCardTrigger` ([USER-CARD.md](USER-CARD.md)), also carrying the `ui-user-card__trigger` class: a button that opens the card in a popover for a click, Enter or Space, still calls `onPress`, keeps the hooks and the accessible name above, and returns focus to the avatar when the card closes.

Implementation: `src/components/presence-avatar/presence-avatar.tsx`, `src/components/user-card/user-card.tsx`
Verification: `src/components/presence-avatar/presence-avatar.test.tsx`, `e2e/presence-avatar.spec.ts`

## Hooks

| Hook                            | Kind      | Values                 | Description                                                |
| ------------------------------- | --------- | ---------------------- | ---------------------------------------------------------- |
| `ui-presence-avatar`            | root      |                        | The `<button>` with `onPress` or `card`, else a `<span>`.  |
| `ui-presence-avatar__avatar`    | slot      |                        | The named avatar image (also `ui-avatar`).                 |
| `ui-presence-avatar__indicator` | slot      |                        | The decorative status badge, when there is a status.       |
| `data-size`                     | attribute | `xs`, `sm`, `md`, `lg` | Avatar size.                                               |
| `data-status`                   | attribute |                        | The caller's status word (`active`, `away`, `idle`, …).    |
| `data-hovered`                  | state     | `true`                 | While the pointer is over a pressable avatar (React Aria). |
| `data-pressed`                  | state     | `true`                 | While a pressable avatar is pressed (React Aria).          |
| `data-focused`                  | state     | `true`                 | While a pressable avatar has focus (React Aria).           |
| `data-focus-visible`            | state     | `true`                 | While it has keyboard focus (React Aria).                  |
