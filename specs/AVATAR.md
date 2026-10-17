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

When the picture fails to load, `Avatar` shall show the initials instead of a broken image. A different `src` shall be tried afresh.

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

## UIC-AVATAR-3 - Accessibility and hooks

### UIC-AVATAR-3.1 - Accessible name

`Avatar` shall render `role="img"` named by its trimmed `label` when given, otherwise by its trimmed `name`, or by the provider's `unnamed` string when the name is blank. With `decorative` it shall instead be hidden from assistive technology (`aria-hidden="true"`, no role), for places where visible text beside it already names the person. The picture always has an empty `alt` and the initials are hidden, so the name is announced once.

Implementation: `src/components/avatar/avatar.tsx`, `src/core/strings.ts`
Verification: `src/components/avatar/avatar.test.tsx`, `e2e/avatar.spec.ts`

### UIC-AVATAR-3.2 - Hooks and caller attributes

`Avatar` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar/avatar.test.tsx`

## Hooks

| Hook                  | Kind      | Values                         | Description                                               |
| --------------------- | --------- | ------------------------------ | --------------------------------------------------------- |
| `ui-avatar`           | root      |                                | The circle (`<span>`).                                    |
| `ui-avatar__image`    | slot      |                                | The picture (`<img>`), while it loads or has loaded.      |
| `ui-avatar__initials` | slot      |                                | The initials, without a picture or after it failed.       |
| `ui-avatar__glyph`    | slot      |                                | The group glyph's `<svg>` (also `ui-glyph`).              |
| `data-size`           | attribute | `xs`, `sm`, `md`, `lg`, `fill` | Circle size.                                              |
| `data-variant`        | attribute | `filled`, `outlined`           | Filled circle or ring.                                    |
| `data-kind`           | attribute | `person`, `group`              | Whether the avatar draws a person or a group.             |
| `data-color`          | attribute |                                | The colour slot, an integer from `0` to `colorCount - 1`. |
