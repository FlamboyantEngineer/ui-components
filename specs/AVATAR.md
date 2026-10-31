# Avatar

`Avatar` draws a person as their picture, or as their initials on a stable colour slot when there is no picture. A group draws a group glyph. The avatar never writes a colour: it publishes the slot number and the host stylesheet maps each slot to a colour and a legible ink.

## UIC-AVATAR-1 - Content

### UIC-AVATAR-1.1 - Picture, initials or glyph

`Avatar` shall draw the picture at `src` in the `ui-avatar__image` slot when `src` is not blank, otherwise its initials in the `ui-avatar__initials` slot. With `kind="group"` it shall draw the decorative `users` glyph in the `ui-avatar__glyph` slot instead, ignoring `src` and `initials`. `kind` defaults to `person` and is published in `data-kind`.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-1.2 - Initials

The initials shall be the trimmed `initials` prop when it is not blank, otherwise those `getInitials` derives from `name` ([INITIALS.md](INITIALS.md)), which is `?` for a blank name.

Implementation: `src/components/avatar/avatar.tsx`, `src/utils/initials.ts`
Verification: `src/components/avatar/avatar.test.tsx`

### UIC-AVATAR-1.3 - Colour slot

`Avatar` shall publish a colour slot in `data-color`: the explicit `colorIndex` truncated and wrapped into the palette when it is a finite number, otherwise `getColorIndex(colorKey, colorCount)` ([COLOR-INDEX.md](COLOR-INDEX.md)), with `name` standing in for a blank or missing `colorKey`. `colorCount` is the number of slots the host stylesheet defines, `8` by default; an invalid count uses the default. The same key keeps the same slot whatever the name, so a renamed person keeps their colour. A group publishes no slot unless it has an explicit `colorIndex`. The avatar sets no inline colour.

Implementation: `src/components/avatar/avatar.tsx`, `src/utils/color-index.ts`, `labs/reference/avatar.css`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-1.4 - Picture fallback

When the picture fails to load, `Avatar` shall show the initials instead of a broken image. A different request shall be tried afresh: a new `src`, or new `imageProps` that choose or fetch the image (`srcSet`, `sizes`, `crossOrigin`, `referrerPolicy`), so a working responsive candidate offered after a failure is loaded.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-1.5 - Loading status

`Avatar` shall track its picture's loading status: `idle` when there is no picture to load (a blank `src` or a group), `loading` from a new request (UIC-AVATAR-1.4) until it loads or fails, then `loaded` or `error`; each request gets its own `<img>`, so a load or error of a request that has since changed is ignored. `onLoadingStatusChange` shall be called with the status once on mount and once each time it changes. While the picture loads, the root shall carry `data-loading`, so the stylesheet can draw a placeholder. A picture the browser settled before the avatar could listen, such as one that loaded or failed before hydration, counts as loaded or failed. A lazy picture the browser has not fetched yet stays loading until it settles.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-1.6 - Picture attributes

`imageProps` shall set the picture's `srcSet`, `sizes`, `crossOrigin`, `referrerPolicy` and `loading` attributes, for responsive, cross-origin and lazily loaded pictures. They apply only while `src` draws a picture.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

## UIC-AVATAR-2 - Presentation

### UIC-AVATAR-2.1 - Sizes

`size` shall publish `data-size`: `xs`, `sm`, `md` (the default), `lg`, or `fill`, which takes the whole box its container gives it. The avatar has no interactive states; a pressable or selected avatar belongs to its container. The reference sheet draws circles of 20, 24, 32 and 40 pixels.

Implementation: `src/components/avatar/avatar.tsx`, `labs/reference/avatar.css`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-2.2 - Variants

`variant` shall publish `data-variant`: `filled` (the default), where the initials sit on the colour slot, or `outlined`, where the circle is ringed and the initials sit on the container's own ground.

Implementation: `src/components/avatar/avatar.tsx`, `labs/reference/avatar.css`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-2.3 - Shapes

`shape` shall publish `data-shape`: `circle` (the default) for people, or `rounded` or `square` for bots, organisations and groups. The reference sheet rounds the corners of a `rounded` avatar and leaves a `square` one square. Like the other identity fields, `shape` reaches the avatar of every component that draws one.

Implementation: `src/components/avatar/avatar.tsx`, `labs/reference/avatar.css`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

## UIC-AVATAR-3 - Accessibility and hooks

### UIC-AVATAR-3.1 - Accessible name

`Avatar` shall render `role="img"` named by its trimmed `label` when given, otherwise by its trimmed `name`, or by the provider's `unnamed` string when the name is blank. With `decorative` it shall instead be hidden from assistive technology (`aria-hidden="true"`, no role), for places where visible text beside it already names the person. The picture always has an empty `alt` and the initials are hidden, so the name is announced once.

Implementation: `src/components/avatar/avatar.tsx`, `src/core/strings.ts`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-3.2 - Hooks and caller attributes

`Avatar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`

## UIC-AVATAR-4 - Unified options

### UIC-AVATAR-4.1 - Optional presence

Avatar shall publish an optional status and its decorative indicator outside the clipped surface. Its root announces the name and optional human-readable status, and also handles cards, commands and name tooltips.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/unified-options.spec.ts`

## UIC-AVATAR-11 - Contract

### UIC-AVATAR-11.1 - Avatar and status

`Avatar` shall draw an `Avatar` in the `ui-avatar__surface` slot, passing it `name`, `src`, `imageProps`, `initials`, `colorKey`, `colorIndex`, `colorCount`, `kind` and `shape` ([AVATAR.md](AVATAR.md)). A `status`, a `PresenceStatus` (`active`, `away`, `busy` or `idle`, the vocabulary [Status Light](STATUS-LIGHT.md), [User Identity](USER-IDENTITY.md) and [User Card](USER-CARD.md) share), shall be published in `data-status` on the root, together with a decorative `ui-avatar__indicator` element the stylesheet can draw as a badge. Without a status neither renders.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.2 - Accessible name

The avatar shall be the `role="img"` that names the person: by the trimmed `name` (or the provider's `unnamed` string when it is blank), joined through the provider's `nameWithStatus` string with the status in words (`Maria Santos, Away`): the trimmed `statusLabel` when it is not blank, else the provider's `presenceStatus` string for `status`. User Identity and User Card name a status the same way. The root adds no role or label of its own, so a pressable root takes its name from that image and its visible initials never conflict with a separate label. The one exception is a static avatar with a name tooltip ([UIC-AVATAR-11.7](#uic-avatar-27---name-tooltip)).

Implementation: `src/components/avatar/avatar.tsx`, `src/components/avatar/avatar.tsx`, `src/core/strings.ts`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.3 - Pressing

With `onPress`, the root shall be a React Aria button: one tab stop that calls `onPress` once for a click, Enter or Space, takes focus when clicked, does not repeat for a held key, and publishes React Aria's `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` states. Without `onPress`, `card` or `nameTooltip` the root is a plain `<span>` with no tab stop.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.4 - Sizes

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root and size the avatar to match.

Implementation: `src/components/avatar/avatar.tsx`, `labs/reference/avatar.css`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.5 - Hooks and caller attributes

`Avatar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar-presence.test.tsx`

### UIC-AVATAR-11.6 - Person card

With `card`, the root shall be a `UserCardTrigger` ([USER-CARD-TRIGGER.md](USER-CARD-TRIGGER.md)), also carrying the `ui-user-card-trigger` class: a button that opens the card in a popover for a click, Enter or Space, still calls `onPress`, keeps the hooks and the accessible name above, and returns focus to the avatar when the card closes. `cardTrigger` is the trigger's `trigger` ([UIC-AVATAR-11.8](#uic-avatar-28---card-on-hover)).

Implementation: `src/components/avatar/avatar.tsx`, `src/components/user-card/user-card.tsx`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.7 - Name tooltip

With `nameTooltip`, the presence avatar shall show its accessible name (`Maria Santos, Away`) in a `Tooltip` ([TOOLTIP.md](TOOLTIP.md)) when the pointer rests on it and when keyboard focus reaches it. The tooltip is visual: the trigger's description stays empty, so the name is read once. A pressable avatar or card trigger keeps its name from the image. A static avatar becomes a React Aria `Focusable` image instead, one tab stop with `role="img"` named by that text and a decorative avatar inside, so keyboard users can reach the tooltip too. An avatar whose card opens on hover shows no tooltip, since the card names the person.

Implementation: `src/components/avatar/avatar.tsx`, `labs/reference/avatar.css`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.8 - Card on hover

With `card` and `cardTrigger="hover"`, the card shall open on hover and keyboard focus after the preview delays, or on a long press, without moving focus, as a `UserCardTrigger` with `trigger="hover"` does ([UIC-USER-CARD-TRIGGER-1.3](USER-CARD-TRIGGER.md#uic-user-card-trigger-13---opening-on-hover-and-focus)). Pressing the avatar still calls `onPress`.

Implementation: `src/components/avatar/avatar.tsx`, `src/components/user-card/user-card.tsx`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

### UIC-AVATAR-11.9 - Stable button

A pressable avatar (with `onPress` or `card`) shall keep the same button element, and its focus, while `card`, `cardTrigger` or `nameTooltip` change, so a card or tooltip that becomes available later does not interrupt keyboard navigation. The button carries the `ui-user-card-trigger` class and the card's ARIA state only while it has a card.

Implementation: `src/components/avatar/avatar.tsx`, `src/components/avatar/avatar-root.tsx`, `src/components/user-card/user-card.tsx`
Verification: `src/components/avatar/avatar-presence.test.tsx`, `e2e/avatar-presence.spec.ts`

## Hooks

| Hook                  | Kind      | Values                         | Description                                               |
| --------------------- | --------- | ------------------------------ | --------------------------------------------------------- |
| `ui-avatar`           | root      |                                | The avatar (`<span>`).                                    |
| `ui-avatar__image`    | slot      |                                | The picture (`<img>`), while it loads or has loaded.      |
| `ui-avatar__initials` | slot      |                                | The initials, without a picture or after it failed.       |
| `ui-avatar__glyph`    | slot      |                                | The group glyph's `<svg>` (also `ui-glyph`).              |
| `data-size`           | attribute | `xs`, `sm`, `md`, `lg`, `fill` | Circle size.                                              |
| `data-variant`        | attribute | `filled`, `outlined`           | Filled circle or ring.                                    |
| `data-kind`           | attribute | `person`, `group`              | Whether the avatar draws a person or a group.             |
| `data-shape`          | attribute | `circle`, `rounded`, `square`  | The avatar's corners.                                     |
| `data-color`          | attribute |                                | The colour slot, an integer from `0` to `colorCount - 1`. |
| `data-loading`        | state     | `true`                         | While the picture loads.                                  |

| `ui-avatar__surface` | slot | | The clipped picture or initials; the status dot sits outside it. |
| `ui-avatar__indicator` | slot | | The decorative status badge, when there is a status. |
| `data-status` | attribute | | The `status`: `active`, `away`, `busy` or `idle`. |
| `data-hovered` | state | `true` | While the pointer is over a pressable avatar (React Aria). |
| `data-pressed` | state | `true` | While a pressable avatar is pressed (React Aria). |
| `data-focused` | state | `true` | While a pressable avatar has focus (React Aria). |
| `data-focus-visible` | state | `true` | While it has keyboard focus (React Aria). |
