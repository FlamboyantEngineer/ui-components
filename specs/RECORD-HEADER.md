# Record Header

`RecordHeader` is a record's title row on its detail page: the record's kind icon and identifier ([Record Label](RECORD-LABEL.md)) with a [Copy Button](COPY-BUTTON.md), its title as a heading, editable in place with [Inline Edit](INLINE-EDIT.md), its state (a [Badge](BADGE.md), a [Status Light](STATUS-LIGHT.md) or a [Transition Menu](TRANSITION-MENU.md)), a [Meta Line](META-LINE.md) of metadata such as an [Attribution](ATTRIBUTION.md), and its actions, such as an [Action Row](ACTION-ROW.md). The caller owns the record and saves its title.

## UIC-RECORD-HEADER-1 - Parts

### UIC-RECORD-HEADER-1.1 - Identity

`RecordHeader` shall render a `<div>` root (`ui-record-header`) that starts with an identity group (`ui-record-header__identity`) holding a small [Record Label](RECORD-LABEL.md) (`ui-record-header__label`) of `icon` and `identifier`, followed by a small [Copy Button](COPY-BUTTON.md) (`ui-record-header__copy`) that copies the identifier, named by the provider's `copyIdentifier` string for it.

Implementation: `src/components/record-header/record-header.tsx`, `src/core/view-strings.ts`
Verification: `src/components/record-header/record-header.test.tsx`, `e2e/record-header.spec.ts`

### UIC-RECORD-HEADER-1.2 - Title

The title (`ui-record-header__title`) shall follow as a heading of `headingLevel`, or one level below the enclosing section's, else 3 ([Section Header](SECTION-HEADER.md)). Without `onTitleChange` it is an `<h1>`–`<h6>` element holding `title`.

Implementation: `src/components/record-header/record-header.tsx`
Verification: `src/components/record-header/record-header.test.tsx`, `e2e/record-header.spec.ts`

### UIC-RECORD-HEADER-1.3 - Editable title

With `onTitleChange`, the title shall be an element with role `heading` and `aria-level`, named by a non-empty `title` alone, holding an [Inline Edit](INLINE-EDIT.md) of `title` named by the provider's `recordTitle` string, with `titlePlaceholder` shown while the title is empty; saving a changed title calls `onTitleChange` with it, pending and failing as Inline Edit does, and the root publishes `data-editable`.

Implementation: `src/components/record-header/record-header.tsx`, `src/core/view-strings.ts`
Verification: `src/components/record-header/record-header.test.tsx`, `e2e/record-header.spec.ts`

### UIC-RECORD-HEADER-1.4 - Status, metadata and actions

`status` shall follow the title in `ui-record-header__status`, `meta` entries in a [Meta Line](META-LINE.md) (`ui-record-header__meta`) and `actions` in `ui-record-header__actions`; each part renders only when given.

Implementation: `src/components/record-header/record-header.tsx`
Verification: `src/components/record-header/record-header.test.tsx`, `e2e/record-header.spec.ts`

### UIC-RECORD-HEADER-1.5 - Hooks and caller attributes

`RecordHeader` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/record-header/record-header.tsx`
Verification: `src/components/record-header/record-header.test.tsx`

## UIC-RECORD-HEADER-2 - Accessibility

### UIC-RECORD-HEADER-2.1 - Reading order

The parts shall follow in reading order (identity, title, status, metadata, actions), so the record is announced by its identifier and title before its state; the kind icon is decorative.

Implementation: `src/components/record-header/record-header.tsx`
Verification: `src/components/record-header/record-header.test.tsx`, `e2e/record-header.spec.ts`

## Hooks

| Hook                         | Kind  | Values | Description                                            |
| ---------------------------- | ----- | ------ | ------------------------------------------------------ |
| `ui-record-header`           | root  |        | The header (`<div>`).                                  |
| `ui-record-header__identity` | slot  |        | The identifier and its copy button.                    |
| `ui-record-header__label`    | slot  |        | The kind icon and identifier (also `ui-record-label`). |
| `ui-record-header__copy`     | slot  |        | The copy button (also `ui-copy-button`).               |
| `ui-record-header__title`    | slot  |        | The title heading.                                     |
| `ui-record-header__status`   | slot  |        | The record's state.                                    |
| `ui-record-header__meta`     | slot  |        | The line of metadata (also `ui-meta-line`).            |
| `ui-record-header__actions`  | slot  |        | The record's actions.                                  |
| `data-editable`              | state | `true` | The title is editable in place.                        |
