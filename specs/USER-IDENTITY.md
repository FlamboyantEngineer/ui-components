# User Identity

`UserIdentity` is the row that names a person: a decorative avatar, one display name and an optional secondary line. It adds no background, border, role or tab stop; the surrounding option, chip, table row or button owns selection, focus and actions.

## UIC-USER-IDENTITY-1 - Contract

### UIC-USER-IDENTITY-1.1 - Avatar, name and secondary line

`UserIdentity` shall draw a decorative `Avatar` in the `ui-user-identity__avatar` slot, then a `ui-user-identity__content` column holding a `ui-user-identity__title` line with the trimmed `name` in the `ui-user-identity__name` slot, and, when `description` is given, the secondary line in the `ui-user-identity__description` slot under it. A blank `name` reads as the provider's `unnamed` string. Text is rendered as text, never as markup.

Implementation: `src/components/user-identity/user-identity.tsx`
Verification: `src/components/user-identity/user-identity.test.tsx`, `e2e/user-identity.spec.ts`

### UIC-USER-IDENTITY-1.2 - Caller content

`description` and `nameSuffix` shall accept nodes and keep them as given, such as a `<time>` element or a badge; `nameSuffix` follows the name on the title line. A missing, `null`, `false` or blank-string `description` draws no secondary line.

Implementation: `src/components/user-identity/user-identity.tsx`
Verification: `src/components/user-identity/user-identity.test.tsx`

### UIC-USER-IDENTITY-1.3 - Sizes and truncation

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root and size the avatar to match. The reference sheet keeps the name and the secondary line on one line each and ellipsizes them independently while the full text stays in the DOM.

Implementation: `src/components/user-identity/user-identity.tsx`, `labs/reference.css`
Verification: `src/components/user-identity/user-identity.test.tsx`, `e2e/user-identity.spec.ts`

### UIC-USER-IDENTITY-1.4 - Avatar identity

`src`, `initials`, `colorKey`, `colorIndex`, `colorCount` and `kind` shall reach the avatar unchanged, so the row follows the avatar's picture fallback, initials, colour slot and group glyph rules ([AVATAR.md](AVATAR.md)).

Implementation: `src/components/user-identity/user-identity.tsx`, `src/components/avatar/avatar.tsx`
Verification: `src/components/user-identity/user-identity.test.tsx`

### UIC-USER-IDENTITY-1.5 - Accessibility

`UserIdentity` shall be noninteractive: no role, tab stop or accessible name of its own. The avatar is hidden from assistive technology and the visible name identifies the person.

Implementation: `src/components/user-identity/user-identity.tsx`
Verification: `src/components/user-identity/user-identity.test.tsx`, `e2e/user-identity.spec.ts`

### UIC-USER-IDENTITY-1.6 - Hooks and caller attributes

`UserIdentity` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/user-identity/user-identity.tsx`
Verification: `src/components/user-identity/user-identity.test.tsx`

## Hooks

| Hook                            | Kind      | Values                 | Description                                   |
| ------------------------------- | --------- | ---------------------- | --------------------------------------------- |
| `ui-user-identity`              | root      |                        | The row (`<span>`).                           |
| `ui-user-identity__avatar`      | slot      |                        | The decorative avatar (also `ui-avatar`).     |
| `ui-user-identity__content`     | slot      |                        | The column holding the title and description. |
| `ui-user-identity__title`       | slot      |                        | The line holding the name and its suffix.     |
| `ui-user-identity__name`        | slot      |                        | The display name.                             |
| `ui-user-identity__description` | slot      |                        | The secondary line.                           |
| `data-size`                     | attribute | `xs`, `sm`, `md`, `lg` | Row and avatar size.                          |
