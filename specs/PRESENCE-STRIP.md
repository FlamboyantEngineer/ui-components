# Presence Strip

`PresenceStrip` shows the people currently present as one row of presence avatars, with a `+N` count for the people it has no room for. It takes plain data: the caller decides who is present, in what order and with which status, and handles what pressing a person does.

## UIC-PRESENCE-STRIP-1 - People

### UIC-PRESENCE-STRIP-1.1 - Order and status

`PresenceStrip` shall draw a `PresenceAvatar` for each visible person, in the order of `people`, each also carrying the `ui-presence-strip__person` slot class and receiving the person's avatar fields, `status` and `statusLabel` ([PRESENCE-AVATAR.md](PRESENCE-AVATAR.md)). A person's element is kept across renders by their `id`, and repeated ids are allowed.

Implementation: `src/components/presence-strip/presence-strip.tsx`, `src/utils/stable-keys.ts`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

### UIC-PRESENCE-STRIP-1.2 - Maximum visible and overflow

`maxVisible` shall show at most that many people from the start of the list, all of them when it is missing. The `ui-presence-strip__overflow` element shall show `+N`, where `N` is the number of people past `maxVisible` plus the whole, non-negative `overflowCount` of people the caller already left out. It is absent when `N` is zero. With no visible person and no overflow the strip renders nothing.

Implementation: `src/components/presence-strip/presence-strip.tsx`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

### UIC-PRESENCE-STRIP-1.3 - Accessible names

The `avatars` strip shall be a `role="group"` named by the trimmed `aria-label`, otherwise by the names of every person in `people` and in `hiddenNames`, joined by commas. Its overflow shall be a `role="img"` named by the provider's `morePeople` string from the count and the names it hides: the people past `maxVisible`, then `hiddenNames` (`3 more people: Jon Berg, Lena Ortiz, Sam Okafor`). Blank names read as the provider's `unnamed` string.

Implementation: `src/components/presence-strip/presence-strip.tsx`, `src/core/strings.ts`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

### UIC-PRESENCE-STRIP-1.4 - Pressing a person

With `onAction`, each person shall be a pressable presence avatar that calls `onAction` with the person's `id` once per click, Enter or Space. Without it each person is a named image and the strip has no tab stop.

Implementation: `src/components/presence-strip/presence-strip.tsx`, `src/components/presence-avatar/presence-avatar.tsx`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

### UIC-PRESENCE-STRIP-1.5 - Person cards

With `renderCard`, each visible person for whom it returns content shall be a presence avatar whose `card` is that content, usually a `UserCard`, so pressing the person opens it ([PRESENCE-AVATAR.md](PRESENCE-AVATAR.md)); `onAction` is still called. A person for whom it returns nothing opens no card.

Implementation: `src/components/presence-strip/presence-strip.tsx`, `src/components/presence-avatar/presence-avatar.tsx`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

## UIC-PRESENCE-STRIP-2 - Presentation

### UIC-PRESENCE-STRIP-2.1 - Variants

`variant` shall publish `data-variant`: `avatars` (the default), or `dots`, which draws each visible person as a `ui-presence-strip__dot` carrying the person's colour slot in `data-color` and the overflow as plain `+N` text, for use inside another control. The `dots` strip is hidden from assistive technology, with no group role, name, button or tab stop; the containing control describes who is present.

Implementation: `src/components/presence-strip/presence-strip.tsx`, `labs/reference.css`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

### UIC-PRESENCE-STRIP-2.2 - Sizes

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root and size every presence avatar. `colorCount` reaches every avatar and dot.

Implementation: `src/components/presence-strip/presence-strip.tsx`, `labs/reference.css`
Verification: `src/components/presence-strip/presence-strip.test.tsx`, `e2e/presence-strip.spec.ts`

### UIC-PRESENCE-STRIP-2.3 - Hooks and caller attributes

`PresenceStrip` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/presence-strip/presence-strip.tsx`
Verification: `src/components/presence-strip/presence-strip.test.tsx`

## Hooks

| Hook                          | Kind      | Values                 | Description                                                     |
| ----------------------------- | --------- | ---------------------- | --------------------------------------------------------------- |
| `ui-presence-strip`           | root      |                        | The strip (`<span>`).                                           |
| `ui-presence-strip__person`   | slot      |                        | Each visible person's presence avatar (`avatars` variant).      |
| `ui-presence-strip__dot`      | slot      |                        | Each visible person's dot (`dots` variant).                     |
| `ui-presence-strip__overflow` | slot      |                        | The `+N` count.                                                 |
| `data-variant`                | attribute | `avatars`, `dots`      | Avatars or decorative dots.                                     |
| `data-size`                   | attribute | `xs`, `sm`, `md`, `lg` | Avatar size.                                                    |
| `data-color`                  | attribute |                        | A dot's colour slot, as on the avatar ([AVATAR.md](AVATAR.md)). |
